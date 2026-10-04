from __future__ import annotations

import cv2
import numpy as np


def _blend(original: np.ndarray, styled: np.ndarray, intensity: float) -> np.ndarray:
    intensity = float(np.clip(intensity, 0.0, 1.0))
    return cv2.addWeighted(original, 1.0 - intensity, styled, intensity, 0)


def _posterize(frame: np.ndarray, levels: int = 5) -> np.ndarray:
    levels = max(2, levels)
    step = 256 // levels
    return ((frame // step) * step + step // 2).astype(np.uint8)


def _ink_edges(frame: np.ndarray, low: int = 70, high: int = 150) -> np.ndarray:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 7, 60, 60)
    edges = cv2.Canny(gray, low, high)
    edges = cv2.dilate(edges, np.ones((2, 2), np.uint8), iterations=1)
    return 255 - edges


def _halftone_mask(shape: tuple[int, int], spacing: int = 10, radius: int = 2) -> np.ndarray:
    height, width = shape
    mask = np.full((height, width), 255, dtype=np.uint8)
    yy, xx = np.indices((height, width))
    grid_x = xx % spacing
    grid_y = yy % spacing
    dots = (grid_x - spacing // 2) ** 2 + (grid_y - spacing // 2) ** 2 <= radius**2
    mask[dots] = 0
    return mask


def _animated_noise(shape: tuple[int, int], tick: int, scale: int = 5) -> np.ndarray:
    height, width = shape
    small_h = max(1, height // scale)
    small_w = max(1, width // scale)
    rng = np.random.default_rng(12345 + tick // 3)
    noise = rng.integers(0, 256, (small_h, small_w), dtype=np.uint8)
    return cv2.resize(noise, (width, height), interpolation=cv2.INTER_NEAREST)


def _rgb_offset(frame: np.ndarray, amount: int = 4) -> np.ndarray:
    b, g, r = cv2.split(frame)
    matrix_left = np.float32([[1, 0, -amount], [0, 1, 0]])
    matrix_right = np.float32([[1, 0, amount], [0, 1, 0]])
    r = cv2.warpAffine(r, matrix_right, (frame.shape[1], frame.shape[0]))
    b = cv2.warpAffine(b, matrix_left, (frame.shape[1], frame.shape[0]))
    return cv2.merge([b, g, r])


def apply_clean(frame: np.ndarray) -> np.ndarray:
    return frame.copy()


def apply_black_white_ink(frame: np.ndarray, intensity: float) -> np.ndarray:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    adaptive = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        17,
        4,
    )
    edges = _ink_edges(frame, 55, 135)
    ink = cv2.bitwise_and(adaptive, edges)
    styled = cv2.cvtColor(ink, cv2.COLOR_GRAY2BGR)
    return _blend(frame, styled, intensity)


def apply_spiderverse_comic(frame: np.ndarray, intensity: float, tick: int) -> np.ndarray:
    color = _posterize(cv2.convertScaleAbs(frame, alpha=1.18, beta=8), levels=6)
    color = _rgb_offset(color, amount=3)

    edges = _ink_edges(frame, 60, 145)
    edge_bgr = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
    color = cv2.bitwise_and(color, edge_bgr)

    halftone = _halftone_mask(frame.shape[:2], spacing=9, radius=2)
    shadow = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) < 105
    color[shadow & (halftone == 0)] = (18, 18, 24)

    noise = _animated_noise(frame.shape[:2], tick, scale=7)
    paper = cv2.cvtColor(noise // 9, cv2.COLOR_GRAY2BGR)
    styled = cv2.add(color, paper)
    return _blend(frame, styled, intensity)


def apply_riso_cyanotype(frame: np.ndarray, intensity: float, tick: int) -> np.ndarray:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    noise = _animated_noise(frame.shape[:2], tick, scale=4)

    cyan = ((gray > 70) & (noise > 95)).astype(np.uint8) * 255
    yellow = ((gray > 115) & (noise > 125)).astype(np.uint8) * 255
    red = ((gray < 150) & (noise > 170)).astype(np.uint8) * 255

    canvas = np.full_like(frame, 246)
    canvas[:, :, 1] = np.minimum(canvas[:, :, 1], 255 - cyan // 3)
    canvas[:, :, 2] = np.minimum(canvas[:, :, 2], 255 - cyan // 8)
    canvas[:, :, 0] = np.minimum(canvas[:, :, 0], 255 - yellow // 4)
    canvas[red > 0] = (50, 55, 200)

    dots = _halftone_mask(frame.shape[:2], spacing=8, radius=2)
    canvas[dots == 0] = (35, 95, 185)
    return _blend(frame, canvas, intensity)


def apply_hybrid_print(frame: np.ndarray, intensity: float, tick: int) -> np.ndarray:
    comic = apply_spiderverse_comic(frame, 1.0, tick)
    riso = apply_riso_cyanotype(frame, 1.0, tick)
    hybrid = cv2.addWeighted(comic, 0.62, riso, 0.38, 0)
    edges = cv2.cvtColor(_ink_edges(frame, 45, 120), cv2.COLOR_GRAY2BGR)
    hybrid = cv2.bitwise_and(hybrid, edges)
    return _blend(frame, hybrid, intensity)
