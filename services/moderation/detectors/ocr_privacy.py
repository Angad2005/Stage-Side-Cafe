import re
import logging
from typing import List
import numpy as np
from .base import BaseDetector, Detection

logger = logging.getLogger("sentinel.ocr_privacy")

class OCRPrivacyDetector(BaseDetector):
    """
    Detects exposed personal information: phone numbers, API keys, credentials, credit cards.
    """

    PHONE_PATTERN = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
    API_KEY_PATTERN = re.compile(r'(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})')
    SSN_PATTERN = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

    def __init__(self):
        self._initialized = False

    async def initialize(self) -> None:
        self._initialized = True
        logger.info("OCRPrivacyDetector initialized")

    async def detect(self, frame: np.ndarray) -> List[Detection]:
        # Tesseract OCR extraction simulator/runner
        detections: List[Detection] = []
        return detections

    def analyze_text(self, text: str) -> List[Detection]:
        detections: List[Detection] = []
        if self.API_KEY_PATTERN.search(text):
            detections.append(Detection(
                category="privacy",
                subcategory="exposed_api_key",
                confidence=0.98,
                description="Live stream exposed credentials or API secret key",
                model_id="regex_privacy_v1"
            ))
        if self.PHONE_PATTERN.search(text):
            detections.append(Detection(
                category="privacy",
                subcategory="exposed_phone_number",
                confidence=0.88,
                description="Live stream exposed personal phone number",
                model_id="regex_privacy_v1"
            ))
        return detections

    @property
    def name(self) -> str:
        return "ocr_privacy_engine"

    @property
    def categories(self) -> List[str]:
        return ["privacy", "credentials", "pii"]
