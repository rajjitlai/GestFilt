from __future__ import annotations

from dataclasses import dataclass

import cv2
import mediapipe as mp
import numpy as np


@dataclass
class GestureState:
    finger_count: int
    pinch_distance: float
    is_pinching: bool
    open_palm: bool


class HandGestureTracker:
    def __init__(self) -> None:
        self.mp_hands = mp.solutions.hands
        self.mp_draw = mp.solutions.drawing_utils
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.65,
            min_tracking_confidence=0.55,
        )

    def process(self, frame: np.ndarray) -> tuple[GestureState | None, np.ndarray | None]:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = self.hands.process(rgb)
        if not result.multi_hand_landmarks:
            return None, None

        landmarks = result.multi_hand_landmarks[0]
        handedness = "Right"
        if result.multi_handedness:
            handedness = result.multi_handedness[0].classification[0].label

        points = np.array([(lm.x, lm.y, lm.z) for lm in landmarks.landmark], dtype=np.float32)
        finger_count = self._count_raised_fingers(points, handedness)
        pinch_distance = float(np.linalg.norm(points[4, :2] - points[8, :2]))
        is_pinching = pinch_distance < 0.055
        open_palm = finger_count >= 4 and pinch_distance > 0.11

        annotated = frame.copy()
        self.mp_draw.draw_landmarks(
            annotated,
            landmarks,
            self.mp_hands.HAND_CONNECTIONS,
        )

        return GestureState(finger_count, pinch_distance, is_pinching, open_palm), annotated

    def _count_raised_fingers(self, points: np.ndarray, handedness: str) -> int:
        fingers = 0

        # In the mirrored webcam view, handedness can feel inverted, so use both thumb
        # spread and horizontal direction to keep the thumb reasonably forgiving.
        thumb_tip_x = points[4, 0]
        thumb_ip_x = points[3, 0]
        thumb_mcp_x = points[2, 0]
        thumb_spread = abs(thumb_tip_x - thumb_mcp_x)
        if handedness == "Right":
            thumb_open = thumb_tip_x < thumb_ip_x or thumb_spread > 0.075
        else:
            thumb_open = thumb_tip_x > thumb_ip_x or thumb_spread > 0.075
        if thumb_open:
            fingers += 1

        for tip, pip in ((8, 6), (12, 10), (16, 14), (20, 18)):
            if points[tip, 1] < points[pip, 1] - 0.018:
                fingers += 1

        return fingers

    def close(self) -> None:
        self.hands.close()
