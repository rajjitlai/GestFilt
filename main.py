from __future__ import annotations

import time
from dataclasses import dataclass

import cv2

from effects import (
    apply_black_white_ink,
    apply_clean,
    apply_hybrid_print,
    apply_riso_cyanotype,
    apply_spiderverse_comic,
)

try:
    from gestures import HandGestureTracker
except ModuleNotFoundError as exc:
    if exc.name != "mediapipe":
        raise
    HandGestureTracker = None


WINDOW_NAME = "Live Comic Overlay"


@dataclass
class OverlayState:
    mode: int = 2
    intensity: float = 0.85
    last_gesture_time: float = 0.0


MODE_NAMES = {
    1: "B/W Ink",
    2: "Spider-Verse Comic",
    3: "Riso/Cyanotype",
    4: "Hybrid Print",
    5: "Clean Camera",
}


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def render_mode(frame, mode: int, intensity: float, tick: int):
    if mode == 1:
        return apply_black_white_ink(frame, intensity)
    if mode == 2:
        return apply_spiderverse_comic(frame, intensity, tick)
    if mode == 3:
        return apply_riso_cyanotype(frame, intensity, tick)
    if mode == 4:
        return apply_hybrid_print(frame, intensity, tick)
    return apply_clean(frame)


def draw_hud(frame, state: OverlayState, fps: float, gesture_text: str) -> None:
    label = f"{MODE_NAMES[state.mode]} | intensity {state.intensity:.2f} | {fps:.0f} FPS"
    cv2.rectangle(frame, (12, 12), (690, 92), (0, 0, 0), -1)
    cv2.putText(
        frame,
        label,
        (24, 42),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.72,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        gesture_text,
        (24, 76),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (190, 235, 255),
        1,
        cv2.LINE_AA,
    )


def apply_keyboard(key: int, state: OverlayState) -> bool:
    if key in (ord("q"), ord("Q"), 27):
        return False
    if ord("1") <= key <= ord("5"):
        state.mode = key - ord("0")
    elif key in (ord("+"), ord("=")):
        state.intensity = clamp(state.intensity + 0.08, 0.0, 1.0)
    elif key in (ord("-"), ord("_")):
        state.intensity = clamp(state.intensity - 0.08, 0.0, 1.0)
    return True


def apply_gesture_controls(state: OverlayState, gesture) -> str:
    if gesture is None:
        return "No hand visible. Holding last mode."

    now = time.monotonic()
    gesture_text = (
        f"Hand: {gesture.finger_count} fingers"
        f" | pinch {gesture.pinch_distance:.2f}"
        f" | open palm {gesture.open_palm}"
    )

    # Debounce mode switches so shaky fingers do not flicker through modes.
    if 1 <= gesture.finger_count <= 5 and now - state.last_gesture_time > 0.35:
        state.mode = gesture.finger_count
        state.last_gesture_time = now

    if gesture.is_pinching:
        state.intensity = clamp(state.intensity - 0.045, 0.12, 1.0)
        gesture_text += " | minimizing"
    elif gesture.open_palm:
        state.intensity = clamp(state.intensity + 0.055, 0.0, 1.0)
        gesture_text += " | maximizing"

    return gesture_text


def main() -> None:
    if HandGestureTracker is None:
        raise RuntimeError(
            "MediaPipe is not installed. Run `pip install -r requirements.txt` "
            "from this project folder, then start the app again."
        )

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam 0. Try another camera index in main.py.")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    state = OverlayState()
    tracker = HandGestureTracker()
    last_time = time.monotonic()
    smoothed_fps = 0.0
    tick = 0

    cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            frame = cv2.flip(frame, 1)
            gesture, annotated = tracker.process(frame)
            gesture_text = apply_gesture_controls(state, gesture)

            output = render_mode(frame, state.mode, state.intensity, tick)
            if annotated is not None:
                output = cv2.addWeighted(output, 0.92, annotated, 0.08, 0)

            now = time.monotonic()
            fps = 1.0 / max(now - last_time, 1e-6)
            smoothed_fps = fps if smoothed_fps == 0 else smoothed_fps * 0.9 + fps * 0.1
            last_time = now

            draw_hud(output, state, smoothed_fps, gesture_text)
            cv2.imshow(WINDOW_NAME, output)

            key = cv2.waitKey(1) & 0xFF
            if not apply_keyboard(key, state):
                break

            tick += 1
    finally:
        tracker.close()
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
