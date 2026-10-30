import logging
import os
from typing import Optional, List
import numpy as np

logger = logging.getLogger("sentinel.onnx")

try:
    import onnxruntime as ort
    HAS_ORT = True
except ImportError:
    HAS_ORT = False

class ONNXModelRunner:
    """Manages ONNX runtime inference sessions with GPU/CPU fallback."""

    def __init__(self, model_path: str, device: str = "cpu"):
        self.model_path = model_path
        self.device = device
        self.session: Optional[Any] = None

    def load(self) -> bool:
        if not HAS_ORT or not os.path.exists(self.model_path):
            logger.info(f"ONNX model {self.model_path} not found or onnxruntime not present; using mock predictor.")
            return False

        providers = ["CUDAExecutionProvider", "CPUExecutionProvider"] if self.device == "cuda" else ["CPUExecutionProvider"]
        try:
            self.session = ort.InferenceSession(self.model_path, providers=providers)
            logger.info(f"Loaded ONNX model from {self.model_path} with providers {self.session.get_providers()}")
            return True
        except Exception as e:
            logger.warning(f"Failed to load ONNX session: {e}. Falling back to CPU/mock.")
            return False

    def predict(self, input_tensor: np.ndarray) -> np.ndarray:
        if self.session is None:
            # Simulated dummy output probabilities
            return np.array([[0.02, 0.98]], dtype=np.float32)

        input_name = self.session.get_inputs()[0].name
        outputs = self.session.run(None, {input_name: input_tensor})
        return outputs[0]
