import base64
import cv2
import numpy as np

class FrameProcessor:
    """Handles image preprocessing, scaling, color normalization, and encoding."""

    @staticmethod
    def resize_for_inference(frame: np.ndarray, target_size: int = 384) -> np.ndarray:
        h, w = frame.shape[:2]
        if max(h, w) <= target_size:
            return frame
        scale = target_size / float(max(h, w))
        new_w, new_h = int(w * scale), int(h * scale)
        return cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

    @staticmethod
    def normalize_tensor(frame: np.ndarray) -> np.ndarray:
        """Converts BGR image to normalized float32 NCHW tensor for ONNX."""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, (224, 224))
        tensor = resized.astype(np.float32) / 255.0
        # ImageNet mean & std normalization
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        tensor = (tensor - mean) / std
        # HWC to CHW then add batch dimension (1, C, H, W)
        tensor = np.transpose(tensor, (2, 0, 1))
        return np.expand_dims(tensor, axis=0)

    @staticmethod
    def encode_jpeg_b64(frame: np.ndarray, quality: int = 80) -> str:
        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
        return base64.b64encode(buffer).decode('utf-8')

    @staticmethod
    def decode_jpeg_b64(b64_str: str) -> np.ndarray:
        img_bytes = base64.b64decode(b64_str)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
