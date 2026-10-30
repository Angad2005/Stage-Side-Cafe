from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional, Tuple
import numpy as np

@dataclass
class Detection:
    category: str
    subcategory: Optional[str]
    confidence: float
    description: str
    bounding_box: Optional[Tuple[int, int, int, int]] = None  # (x, y, w, h)
    model_id: str = ""
    model_version: str = "1.0"

class BaseDetector(ABC):
    """Base class for all StageSide visual moderation detection modules."""

    @abstractmethod
    async def initialize(self) -> None:
        """Loads models and warms up inference pipelines."""
        pass

    @abstractmethod
    async def detect(self, frame: np.ndarray) -> List[Detection]:
        """Analyzes a numpy BGR/RGB frame and returns detected safety violations."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def categories(self) -> List[str]:
        pass
