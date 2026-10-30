import subprocess
import logging
from typing import Optional
import numpy as np

logger = logging.getLogger("gateway.twitch_output")

class TwitchOutputStream:
    """
    Encodes sanitized composite program feed to H.264 + AAC and streams to Twitch RTMP ingestion.
    """

    def __init__(self, rtmp_url: str, stream_key: str, width: int = 1920, height: int = 1080, fps: int = 30):
        self.rtmp_url = f"{rtmp_url}/{stream_key}"
        self.width = width
        self.height = height
        self.fps = fps
        self._proc: Optional[subprocess.Popen] = None

    def start(self):
        command = [
            'ffmpeg',
            '-y',
            '-f', 'rawvideo',
            '-vcodec', 'rawvideo',
            '-pix_fmt', 'bgr24',
            '-s', f"{self.width}x{self.height}",
            '-r', str(self.fps),
            '-i', '-',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'veryfast',
            '-b:v', '4500k',
            '-maxrate', '4500k',
            '-bufsize', '9000k',
            '-f', 'flv',
            self.rtmp_url
        ]
        try:
            self._proc = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
            logger.info(f"Twitch RTMP output stream pipeline spawned: {self.rtmp_url}")
        except Exception as e:
            logger.warning(f"Could not spawn FFmpeg process ({e}). Running in simulation mode.")

    def write_frame(self, frame: np.ndarray):
        if self._proc and self._proc.stdin:
            try:
                self._proc.stdin.write(frame.tobytes())
            except Exception:
                pass

    def stop(self):
        if self._proc:
            try:
                self._proc.stdin.close()
                self._proc.terminate()
            except Exception:
                pass
