import logging

logger = logging.getLogger("gateway.whip_receiver")

class WHIPReceiver:
    """WHIP (WebRTC-HTTP Ingestion Protocol) endpoint receiver."""

    def __init__(self, port: int = 8080):
        self.port = port

    def start(self):
        logger.info(f"WHIP Receiver listening on port {self.port}")

    def stop(self):
        logger.info("WHIP Receiver stopped")
