"""
Bounding box utilities following the OpenAI Vision approach
Implements IoU calculation and coordinate conversion helpers
"""

import numpy as np
from typing import List, Tuple


def iou_relative(bbox_a: List[float], bbox_b: List[float]) -> float:
    """
    Calculate Intersection over Union for two bounding boxes in relative coordinates

    Following the recommended approach from OpenAI Vision best practices.

    Args:
        bbox_a: Bounding box [x_min, y_min, x_max, y_max] in relative coords (0-1)
        bbox_b: Bounding box [x_min, y_min, x_max, y_max] in relative coords (0-1)

    Returns:
        IoU score (0.0 to 1.0)
    """
    ax1, ay1, ax2, ay2 = bbox_a
    bx1, by1, bx2, by2 = bbox_b

    # Calculate intersection
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    # Check if there's no intersection
    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0

    # Calculate intersection area
    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)

    # Calculate union area
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union_area = area_a + area_b - inter_area

    if union_area <= 0:
        return 0.0

    iou = inter_area / (union_area + 1e-6)

    return iou


def relative_to_pixel(bbox_rel: List[float], frame_width: int, frame_height: int) -> List[int]:
    """
    Convert relative bounding box to pixel coordinates in [x, y, width, height] format

    Args:
        bbox_rel: Bounding box [x_min, y_min, x_max, y_max] in relative coords (0-1)
        frame_width: Frame width in pixels
        frame_height: Frame height in pixels

    Returns:
        Bounding box [x, y, width, height] in pixel coordinates
    """
    x_min_rel, y_min_rel, x_max_rel, y_max_rel = bbox_rel

    # Clamp to valid range
    x_min_rel = max(0.0, min(1.0, x_min_rel))
    y_min_rel = max(0.0, min(1.0, y_min_rel))
    x_max_rel = max(0.0, min(1.0, x_max_rel))
    y_max_rel = max(0.0, min(1.0, y_max_rel))

    # Convert to pixels
    x_min = int(x_min_rel * frame_width)
    y_min = int(y_min_rel * frame_height)
    x_max = int(x_max_rel * frame_width)
    y_max = int(y_max_rel * frame_height)

    # Calculate width and height
    width = max(1, x_max - x_min)
    height = max(1, y_max - y_min)

    return [x_min, y_min, width, height]


def pixel_to_relative(bbox_px: List[int], frame_width: int, frame_height: int) -> List[float]:
    """
    Convert pixel bounding box to relative coordinates

    Args:
        bbox_px: Bounding box [x, y, width, height] in pixel coordinates
        frame_width: Frame width in pixels
        frame_height: Frame height in pixels

    Returns:
        Bounding box [x_min, y_min, x_max, y_max] in relative coords (0-1)
    """
    x, y, width, height = bbox_px

    x_min_rel = x / frame_width
    y_min_rel = y / frame_height
    x_max_rel = (x + width) / frame_width
    y_max_rel = (y + height) / frame_height

    # Clamp to valid range
    x_min_rel = max(0.0, min(1.0, x_min_rel))
    y_min_rel = max(0.0, min(1.0, y_min_rel))
    x_max_rel = max(0.0, min(1.0, x_max_rel))
    y_max_rel = max(0.0, min(1.0, y_max_rel))

    return [x_min_rel, y_min_rel, x_max_rel, y_max_rel]


def crop_with_padding(
    frame: np.ndarray,
    bbox_px: List[int],
    padding_percent: float = 1.0
) -> Tuple[np.ndarray, List[int]]:
    """
    Crop frame with minimal percentage-based padding for instrument-only output

    Args:
        frame: Input frame (numpy array)
        bbox_px: Bounding box [x, y, width, height] in pixel coordinates
        padding_percent: Percentage padding (default: 1.0% for minimal buffer)

    Returns:
        Tuple of (cropped_frame, actual_crop_coords [x1, y1, x2, y2])
    """
    x, y, w, h = bbox_px
    frame_h, frame_w = frame.shape[:2]

    # Calculate minimal padding in pixels (1% of frame size)
    pad_x = int(frame_w * (padding_percent / 100.0))
    pad_y = int(frame_h * (padding_percent / 100.0))

    # Add minimal padding to avoid edge artifacts
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(frame_w, x + w + pad_x)
    y2 = min(frame_h, y + h + pad_y)

    # Crop
    cropped = frame[y1:y2, x1:x2].copy()

    return cropped, [x1, y1, x2, y2]


def crop_instrument_only(
    frame: np.ndarray,
    bbox_px: List[int],
    padding_pixels: int = 2
) -> np.ndarray:
    """
    Crop frame to show ONLY the instrument with absolute minimal padding

    This function creates ultra-tight crops with just 2 pixels of padding
    to avoid compression artifacts. Use this when you want to ensure
    the output contains only the instrument itself.

    Args:
        frame: Input frame (numpy array)
        bbox_px: Bounding box [x, y, width, height] in pixel coordinates
        padding_pixels: Absolute pixel padding (default: 2px)

    Returns:
        Cropped frame showing only the instrument
    """
    x, y, w, h = bbox_px
    frame_h, frame_w = frame.shape[:2]

    # Add ultra-minimal padding (2 pixels to avoid edge artifacts)
    x1 = max(0, x - padding_pixels)
    y1 = max(0, y - padding_pixels)
    x2 = min(frame_w, x + w + padding_pixels)
    y2 = min(frame_h, y + h + padding_pixels)

    # Ensure valid dimensions
    if x2 <= x1 or y2 <= y1:
        return frame[y:y+h, x:x+w].copy() if (y+h <= frame_h and x+w <= frame_w) else frame

    # Crop to instrument-only region
    cropped = frame[y1:y2, x1:x2].copy()

    return cropped


def xywh_to_xyxy(bbox: List[float]) -> List[float]:
    """
    Convert [x, y, width, height] to [x_min, y_min, x_max, y_max]

    Args:
        bbox: Bounding box [x, y, width, height]

    Returns:
        Bounding box [x_min, y_min, x_max, y_max]
    """
    x, y, w, h = bbox
    return [x, y, x + w, y + h]


def xyxy_to_xywh(bbox: List[float]) -> List[float]:
    """
    Convert [x_min, y_min, x_max, y_max] to [x, y, width, height]

    Args:
        bbox: Bounding box [x_min, y_min, x_max, y_max]

    Returns:
        Bounding box [x, y, width, height]
    """
    x1, y1, x2, y2 = bbox
    return [x1, y1, x2 - x1, y2 - y1]


def calculate_sharpness(frame: np.ndarray, bbox_px: List[int]) -> float:
    """
    Calculate sharpness score for a region using Laplacian variance

    Higher scores indicate sharper images. Useful for selecting the best frame
    to display for each instrument.

    Args:
        frame: Input frame (numpy array, BGR format)
        bbox_px: Bounding box [x, y, width, height] in pixel coordinates

    Returns:
        Sharpness score (higher = sharper)
    """
    import cv2

    x, y, w, h = bbox_px
    frame_h, frame_w = frame.shape[:2]

    # Clamp to frame bounds
    x = max(0, min(x, frame_w - 1))
    y = max(0, min(y, frame_h - 1))
    w = max(1, min(w, frame_w - x))
    h = max(1, min(h, frame_h - y))

    # Extract region
    region = frame[y:y+h, x:x+w]

    if region.size == 0:
        return 0.0

    # Convert to grayscale
    if len(region.shape) == 3:
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    else:
        gray = region

    # Calculate Laplacian variance (sharpness)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = laplacian.var()

    return float(sharpness)


def detect_skin_pixels(frame: np.ndarray, bbox_px: List[int]) -> float:
    """
    Detect percentage of skin-colored pixels in a bounding box region.
    High skin percentage likely means the crop contains a person's face/body.

    Args:
        frame: Input frame (numpy array, BGR format)
        bbox_px: Bounding box [x, y, width, height] in pixel coordinates

    Returns:
        Percentage of skin-colored pixels (0.0-1.0)
    """
    import cv2

    x, y, w, h = bbox_px
    frame_h, frame_w = frame.shape[:2]

    # Clamp to frame bounds
    x = max(0, min(x, frame_w - 1))
    y = max(0, min(y, frame_h - 1))
    w = max(1, min(w, frame_w - x))
    h = max(1, min(h, frame_h - y))

    # Extract region
    region = frame[y:y+h, x:x+w]

    if region.size == 0:
        return 0.0

    # Convert to HSV for skin detection
    hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)

    # Define skin color range in HSV
    # Human skin tones typically fall in these ranges
    lower_skin1 = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin1 = np.array([20, 255, 255], dtype=np.uint8)
    lower_skin2 = np.array([0, 40, 60], dtype=np.uint8)
    upper_skin2 = np.array([25, 200, 255], dtype=np.uint8)

    # Create masks for skin detection
    mask1 = cv2.inRange(hsv, lower_skin1, upper_skin1)
    mask2 = cv2.inRange(hsv, lower_skin2, upper_skin2)
    skin_mask = cv2.bitwise_or(mask1, mask2)

    # Calculate percentage of skin pixels
    total_pixels = region.shape[0] * region.shape[1]
    skin_pixels = np.count_nonzero(skin_mask)
    skin_percentage = skin_pixels / (total_pixels + 1e-6)

    return skin_percentage


def calculate_instrument_score(bbox_px: List[int], confidence: float, frame: np.ndarray = None) -> float:
    """
    Calculate a score for how likely a bounding box contains only an instrument.

    Musical instruments typically have elongated aspect ratios (not square like faces).
    Also checks for skin pixels to reject crops containing faces/people.

    Args:
        bbox_px: Bounding box [x, y, width, height] in pixel coordinates
        confidence: Detection confidence (0-1)
        frame: Optional frame for skin detection analysis

    Returns:
        Score (0-1) - higher means more likely to be instrument-only
    """
    x, y, w, h = bbox_px

    # Calculate aspect ratio
    aspect_ratio = max(w, h) / (min(w, h) + 1e-6)

    # Musical instruments tend to have aspect ratios > 1.5 (elongated)
    # Faces/people tend to be more square (aspect ratio ~1.0-1.3)
    # Score aspect ratios: prefer 1.8-4.0 range
    if aspect_ratio < 1.2:
        aspect_score = 0.2  # Too square, likely includes face
    elif aspect_ratio < 1.5:
        aspect_score = 0.4  # Still quite square
    elif aspect_ratio < 2.5:
        aspect_score = 1.0  # Good range for instruments
    elif aspect_ratio < 4.0:
        aspect_score = 0.9  # Very elongated (good for violins, guitars)
    else:
        aspect_score = 0.6  # Extremely elongated, might be too wide

    # Calculate bbox size score (prefer medium-sized boxes)
    # Very large boxes might include too much background/person
    area = w * h
    if area < 5000:
        size_score = 0.6  # Small
    elif area < 30000:
        size_score = 1.0  # Medium - ideal
    elif area < 100000:
        size_score = 0.8  # Large
    else:
        size_score = 0.4  # Very large, likely includes person

    # Skin detection score - penalize crops with high skin percentage
    skin_score = 1.0  # Default if no frame provided
    if frame is not None:
        try:
            skin_percentage = detect_skin_pixels(frame, bbox_px)

            # Heavy penalty for high skin percentages (likely contains face)
            if skin_percentage > 0.30:  # >30% skin pixels
                skin_score = 0.1  # Very low score - probably contains face
            elif skin_percentage > 0.20:  # >20% skin pixels
                skin_score = 0.3  # Low score
            elif skin_percentage > 0.10:  # >10% skin pixels
                skin_score = 0.6  # Reduced score
            else:
                skin_score = 1.0  # Good - minimal skin detected
        except:
            skin_score = 1.0  # If detection fails, don't penalize

    # Combine scores: confidence (35%), aspect ratio (30%), size (10%), skin (25%)
    total_score = (0.35 * confidence +
                   0.30 * aspect_score +
                   0.10 * size_score +
                   0.25 * skin_score)

    return total_score


def select_best_detection(detections: List[dict], frame: np.ndarray = None) -> dict:
    """
    Select the best detection from a list based on confidence and optionally sharpness

    Args:
        detections: List of detection dictionaries with 'confidence' and 'bbox'
        frame: Optional frame for sharpness calculation

    Returns:
        Best detection dictionary
    """
    if not detections:
        return None

    if frame is None:
        # Just use confidence
        return max(detections, key=lambda d: d.get('confidence', 0))

    # Use confidence + sharpness
    best_det = None
    best_score = -1

    for det in detections:
        confidence = det.get('confidence', 0)
        bbox = det.get('bbox', [0, 0, 1, 1])

        try:
            sharpness = calculate_sharpness(frame, bbox)
            # Weighted score: 70% confidence, 30% normalized sharpness
            score = 0.7 * confidence + 0.3 * min(1.0, sharpness / 1000.0)
        except:
            score = confidence

        if score > best_score:
            best_score = score
            best_det = det

    return best_det


def select_best_instrument_only_detection(detections: List[dict], video_path: str = None) -> dict:
    """
    Select the best detection that most likely shows ONLY the instrument (no person).

    Uses aspect ratio, bbox size, and skin detection analysis to prefer instrument-only
    bounding boxes and reject crops containing faces/people.

    Args:
        detections: List of detection dictionaries with 'confidence', 'bbox', and 'frame_idx'
        video_path: Optional path to video for loading frames for skin detection

    Returns:
        Best instrument-only detection dictionary
    """
    import cv2

    if not detections:
        return None

    best_det = None
    best_score = -1

    for det in detections:
        confidence = det.get('confidence', 0)
        bbox = det.get('bbox', [0, 0, 1, 1])
        frame_idx = det.get('frame_idx', 0)

        # Load frame for skin detection if video path provided
        frame = None
        if video_path:
            try:
                cap = cv2.VideoCapture(video_path)
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                cap.release()
                if not ret:
                    frame = None
            except:
                frame = None

        # Calculate instrument-only score with skin detection
        score = calculate_instrument_score(bbox, confidence, frame)

        if score > best_score:
            best_score = score
            best_det = det

    return best_det


def validate_bbox(bbox: List[float], format: str = 'xywh') -> bool:
    """
    Validate bounding box coordinates

    Args:
        bbox: Bounding box coordinates
        format: Either 'xywh' or 'xyxy'

    Returns:
        True if valid, False otherwise
    """
    if len(bbox) != 4:
        return False

    if format == 'xywh':
        x, y, w, h = bbox
        return w > 0 and h > 0
    elif format == 'xyxy':
        x1, y1, x2, y2 = bbox
        return x2 > x1 and y2 > y1
    else:
        return False
