import sys
import os

# Add paths
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, "services", "media-gateway"))

import pytest
import numpy as np
from buffering.rolling_buffer import RollingBuffer
from switching.state import CameraState, StateTransition
from switching.safety_switch import SafetySwitch
from buffering.buffer_manager import BufferManager

def test_rolling_buffer_invariants():
    buf = RollingBuffer(camera_id="cam_test", duration_seconds=3.0)
    dummy_frame = np.zeros((100, 100, 3), dtype=np.uint8)

    # Push 10 frames at t=1.0 to 2.0
    for i in range(10):
        buf.push_frame(dummy_frame, timestamp=1.0 + (i * 0.1))

    assert buf.frame_count == 10

    # No frames are released before approval
    # Approve frames up to 1.4
    released = buf.approve_frames_until(1.4)
    assert len(released) == 5  # 1.0, 1.1, 1.2, 1.3, 1.4
    assert buf.frame_count == 5

    # Violations purge all pending frames!
    purged = buf.reject_and_purge_all()
    assert purged == 5
    assert buf.frame_count == 0
    assert buf.get_state() == CameraState.UNSAFE

def test_state_machine_manual_restore_invariant():
    # A blocked camera CANNOT automatically transition back to safe without explicit streamer restore
    assert not StateTransition.can_transition(CameraState.UNSAFE, CameraState.SUSPICIOUS)
    assert StateTransition.can_transition(CameraState.UNSAFE, CameraState.SAFE) # Explicit approval

def test_safety_switch_independent_isolation():
    bm = BufferManager()
    sw = SafetySwitch(bm)

    # Initialize Host and Guest cameras
    bm.get_or_create("cam_host")
    bm.get_or_create("cam_guest")

    assert bm.get_buffer("cam_host").is_safe
    assert bm.get_buffer("cam_guest").is_safe

    # Block Guest POV
    sw.block_camera("cam_guest", reason="Visual safety trigger")

    # Guest POV is isolated
    assert not bm.get_buffer("cam_guest").is_safe
    # Crucial architectural differentiator: Host POV remains completely SAFE!
    assert bm.get_buffer("cam_host").is_safe
