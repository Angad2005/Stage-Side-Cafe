import asyncio
import time
import signal
import sys
import logging
import httpx
import numpy as np
from typing import Dict
from .config import config
from .buffering.buffer_manager import BufferManager
from .switching.safety_switch import SafetySwitch
from .compositor.program_feed import ProgramFeedCompositor
from .outputs.livekit_output import LiveKitPublisher
from .outputs.twitch_output import TwitchOutputStream
from .ingestion.rtmp_receiver import CameraIngestPipeline
import cv2
import base64

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("stageside.media_gateway")

class MediaGateway:
    """
    StageSide Media Gateway (Media Plane).
    
    Acts as the preventative barrier between raw OBS feeds and distribution.
    1. Ingests OBS camera inputs (Host, Guest, Gameplay).
    2. Maintains a 2-4s rolling buffer per feed.
    3. Continuously dispatches sampled frames to AI Sentinel.
    4. Automatically cuts any unsafe camera feed and substitutes safe fallback slate.
    5. Outputs sanitized program feed to Twitch and sanitized POV tracks to LiveKit.
    """

    def __init__(self):
        self.buffer_manager = BufferManager(default_duration=config.BUFFER_DURATION_SECONDS)
        self.safety_switch = SafetySwitch(self.buffer_manager)
        self.compositor = ProgramFeedCompositor(self.safety_switch)
        self.livekit_publisher = LiveKitPublisher(config.LIVEKIT_URL, config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET)
        self.twitch_output = TwitchOutputStream(config.TWITCH_RTMP_URL, "live_sample_key")
        self.active_ingests: Dict[str, CameraIngestPipeline] = {}
        self.running = False

    def on_frame_received(self, camera_id: str, frame: np.ndarray, timestamp: float):
        buf = self.buffer_manager.get_or_create(camera_id)
        buf.push_frame(frame, timestamp)

    async def screening_loop(self):
        """
        AI Sentinel Screening Gate:
        Samples unapproved frames from rolling buffers and sends to Sentinel.
        Only approved frames are cleared for delivery!
        """
        async with httpx.AsyncClient(timeout=1.5) as client:
            while self.running:
                for cam_id in self.buffer_manager.all_cameras():
                    buf = self.buffer_manager.get_buffer(cam_id)
                    if not buf or not buf.is_safe:
                        continue

                    sampled = buf.get_frames_for_analysis(sample_step=6)
                    for ts, frame in sampled:
                        try:
                            # Encode to JPEG base64
                            _, buf_img = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
                            b64_payload = base64.b64encode(buf_img).decode('utf-8')

                            resp = await client.post(
                                f"{config.MODERATION_SERVICE_URL}/analyze",
                                json={
                                    "stream_id": "stream_demo",
                                    "camera_id": cam_id,
                                    "timestamp": ts,
                                    "frame_b64": b64_payload
                                }
                            )
                            if resp.status_code == 200:
                                data = resp.json()
                                action = data.get("action")
                                if action == "block" or action == "fail_closed":
                                    # VIOLATION DETECTED: Immediately cut camera!
                                    reason = data.get("reason", "Visual policy violation")
                                    self.safety_switch.block_camera(cam_id, reason)
                                    self.livekit_publisher.isolate_track(cam_id)
                                    logger.critical(f"AUTOMATIC CUT EXECUTED: Camera {cam_id} isolated by AI Sentinel: {reason}")
                                elif action == "allow":
                                    # Approve frames up to this timestamp
                                    buf.approve_frames_until(ts)
                        except Exception as e:
                            logger.debug(f"Sentinel screening call: {e}")

                await asyncio.sleep(1.0 / config.FRAME_SAMPLE_RATE)

    async def broadcast_loop(self):
        """Generates sanitized composite program output for Twitch."""
        while self.running:
            # Composite primary feed (e.g. cam_host) and secondary feeds
            prog_frame = self.compositor.composite_program_frame(
                primary_camera_id="cam_host",
                secondary_camera_ids=["cam_guest", "cam_gameplay"]
            )
            self.twitch_output.write_frame(prog_frame)
            await asyncio.sleep(1.0 / 30.0)

    async def start(self):
        logger.info("Starting StageSide Cafe Media Gateway...")
        self.running = True

        # Initialize demo cameras: cam_host, cam_guest, cam_gameplay
        for cam_id in ["cam_host", "cam_guest", "cam_gameplay"]:
            ingest = CameraIngestPipeline(cam_id, f"rtmp://localhost:1935/live/{cam_id}", self.on_frame_received)
            ingest.start()
            self.active_ingests[cam_id] = ingest
            self.livekit_publisher.publish_safe_track("stageside_stream_001", cam_id, f"track_{cam_id}")

        self.twitch_output.start()

        # Run screening & broadcasting concurrently
        await asyncio.gather(
            self.screening_loop(),
            self.broadcast_loop()
        )

    def stop(self):
        logger.info("Stopping Media Gateway...")
        self.running = False
        for ingest in self.active_ingests.values():
            ingest.stop()
        self.twitch_output.stop()

def main():
    gateway = MediaGateway()

    def signal_handler(sig, frame):
        gateway.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        asyncio.run(gateway.start())
    except KeyboardInterrupt:
        gateway.stop()

if __name__ == "__main__":
    main()
