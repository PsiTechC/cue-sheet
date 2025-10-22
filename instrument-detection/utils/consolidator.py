"""
Consolidate multiple tracks into unique instruments
Extract representative cropped frames for each instrument
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple
from collections import defaultdict
from .bbox_utils import select_best_instrument_only_detection


class InstrumentConsolidator:
    """Consolidates multiple tracks into unique instruments"""

    @staticmethod
    def consolidate_tracks_by_instrument(tracks: List[Dict], video_path: str = None) -> Dict[str, Dict]:
        """
        Consolidate multiple tracks of the same instrument into a single entry

        Args:
            tracks: List of tracks from tracker
            video_path: Optional path to video for intelligent detection selection

        Returns:
            Dictionary keyed by instrument type with consolidated data
        """
        consolidated = defaultdict(lambda: {
            'instrument': '',
            'tracks': [],
            'total_detections': 0,
            'total_duration': 0.0,
            'avg_confidence': 0.0,
            'playing_percentage': 0.0,
            'first_seen': float('inf'),
            'last_seen': 0.0,
            'best_detection': None  # Detection with highest confidence
        })

        for track in tracks:
            instrument = track['instrument'].lower().strip()
            entry = consolidated[instrument]

            # Set instrument name (use first occurrence)
            if not entry['instrument']:
                entry['instrument'] = track['instrument']

            # Add track
            entry['tracks'].append(track)
            entry['total_detections'] += len(track['detections'])
            entry['total_duration'] += track['duration']

            # Update time range
            entry['first_seen'] = min(entry['first_seen'], track['start_time'])
            entry['last_seen'] = max(entry['last_seen'], track['end_time'])

            # Find best detection (highest confidence) and collect top detections
            for det in track['detections']:
                if entry['best_detection'] is None or det['confidence'] > entry['best_detection']['confidence']:
                    entry['best_detection'] = det.copy()

            # Also store top 3 detections for showing alternatives
            if 'top_detections' not in entry:
                entry['top_detections'] = []
            entry['top_detections'].extend(track['detections'])

        # Calculate averages and select best instrument-only detection
        for instrument, data in consolidated.items():
            all_confidences = []
            all_playing = []

            for track in data['tracks']:
                all_confidences.append(track.get('avg_confidence', 0))
                all_playing.append(track.get('playing_percentage', 0))

            data['avg_confidence'] = np.mean(all_confidences) if all_confidences else 0
            data['playing_percentage'] = np.mean(all_playing) if all_playing else 0
            data['num_tracks'] = len(data['tracks'])
            data['time_span'] = data['last_seen'] - data['first_seen']

            # Use intelligent selection to find best instrument-only detection
            # This prioritizes elongated aspect ratios (instruments) over square boxes (faces)
            # and uses skin detection to reject crops containing people
            if data['top_detections']:
                best_instrument_det = select_best_instrument_only_detection(
                    data['top_detections'],
                    video_path=video_path
                )
                if best_instrument_det:
                    data['best_detection'] = best_instrument_det

            # Keep top 5 for reference but prioritize instrument-only selections
            data['top_detections'] = sorted(
                data['top_detections'],
                key=lambda x: x['confidence'],
                reverse=True
            )[:5]

        return dict(consolidated)

    @staticmethod
    def extract_cropped_frame(
        video_path: str,
        frame_idx: int,
        bbox: List[float],
        padding_pixels: int = 2,
        draw_border: bool = False
    ) -> np.ndarray:
        """
        Extract and crop a specific frame region with ultra-minimal padding

        Args:
            video_path: Path to video file
            frame_idx: Frame index to extract
            bbox: Bounding box [x, y, width, height]
            padding_pixels: Ultra-minimal pixel padding (default: 2px to avoid edge artifacts)
            draw_border: Whether to draw a border around the cropped region

        Returns:
            Cropped frame as numpy array
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        # Seek to frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        cap.release()

        if not ret:
            raise ValueError(f"Could not read frame {frame_idx}")

        # Extract bounding box with ultra-minimal pixel padding
        x, y, w, h = map(int, bbox)
        frame_h, frame_w = frame.shape[:2]

        # Add ultra-minimal padding (just 2px to avoid cutting edges due to compression artifacts)
        x1 = max(0, x - padding_pixels)
        y1 = max(0, y - padding_pixels)
        x2 = min(frame_w, x + w + padding_pixels)
        y2 = min(frame_h, y + h + padding_pixels)

        # Ensure valid crop dimensions
        if x2 <= x1 or y2 <= y1:
            # Return small placeholder if invalid
            return np.ones((100, 100, 3), dtype=np.uint8) * 128

        # Crop to tight bounding box
        cropped = frame[y1:y2, x1:x2].copy()

        # Optionally draw border to highlight the region
        if draw_border and cropped.size > 0:
            cv2.rectangle(cropped, (2, 2), (cropped.shape[1]-3, cropped.shape[0]-3),
                         (0, 255, 0), 2)

        return cropped

    @staticmethod
    def get_best_frame_for_instrument(
        video_path: str,
        instrument_data: Dict,
        target_size: Tuple[int, int] = (300, 300),
        padding_pixels: int = 2,
        maintain_aspect: bool = True
    ) -> np.ndarray:
        """
        Get the best representative frame for an instrument with standardized size

        Args:
            video_path: Path to video file
            instrument_data: Consolidated instrument data
            target_size: Target dimensions (width, height) for output
            padding_pixels: Ultra-minimal pixel padding (default: 2px)
            maintain_aspect: If True, maintain aspect ratio with padding; if False, stretch to fit

        Returns:
            Best cropped frame, resized to target_size
        """
        best_det = instrument_data['best_detection']

        if best_det is None:
            # Return placeholder image
            placeholder = np.ones((target_size[1], target_size[0], 3), dtype=np.uint8) * 128
            cv2.putText(
                placeholder,
                "No frame available",
                (20, target_size[1]//2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
            return placeholder

        # Extract cropped frame with ultra-minimal padding
        cropped = InstrumentConsolidator.extract_cropped_frame(
            video_path,
            best_det['frame_idx'],
            best_det['bbox'],
            padding_pixels=padding_pixels,
            draw_border=False
        )

        if cropped.size == 0:
            # Return placeholder if crop failed
            return np.ones((target_size[1], target_size[0], 3), dtype=np.uint8) * 128

        # Standardize output size
        if maintain_aspect:
            # Maintain aspect ratio and add padding if needed
            h, w = cropped.shape[:2]
            target_w, target_h = target_size

            # Calculate scaling to fit within target size
            scale = min(target_w / w, target_h / h)
            new_w = int(w * scale)
            new_h = int(h * scale)

            # Resize maintaining aspect ratio
            resized = cv2.resize(cropped, (new_w, new_h), interpolation=cv2.INTER_AREA)

            # Create canvas and center the image
            canvas = np.ones((target_h, target_w, 3), dtype=np.uint8) * 240  # Light gray background
            y_offset = (target_h - new_h) // 2
            x_offset = (target_w - new_w) // 2
            canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized

            return canvas
        else:
            # Stretch to fit exact size (may distort)
            return cv2.resize(cropped, target_size, interpolation=cv2.INTER_AREA)

    @staticmethod
    def create_instrument_gallery(
        video_path: str,
        consolidated_instruments: Dict[str, Dict],
        output_path: str,
        grid_cols: int = 3
    ):
        """
        Create a gallery image showing all unique instruments

        Args:
            video_path: Path to video file
            consolidated_instruments: Dictionary of consolidated instruments
            output_path: Path to save gallery image
            grid_cols: Number of columns in grid
        """
        import math

        if not consolidated_instruments:
            return

        # Get cropped frames for all instruments
        instrument_images = []
        instrument_names = []

        for instrument, data in sorted(consolidated_instruments.items()):
            img = InstrumentConsolidator.get_best_frame_for_instrument(
                video_path,
                data,
                max_size=(300, 300)
            )
            instrument_images.append(img)
            instrument_names.append(data['instrument'])

        # Calculate grid dimensions
        num_instruments = len(instrument_images)
        grid_rows = math.ceil(num_instruments / grid_cols)

        # Create gallery canvas
        cell_width = 320
        cell_height = 400
        canvas_width = cell_width * grid_cols
        canvas_height = cell_height * grid_rows

        gallery = np.ones((canvas_height, canvas_width, 3), dtype=np.uint8) * 255

        # Place images in grid
        for idx, (img, name) in enumerate(zip(instrument_images, instrument_names)):
            row = idx // grid_cols
            col = idx % grid_cols

            # Calculate position
            x = col * cell_width
            y = row * cell_height

            # Place image (centered)
            img_h, img_w = img.shape[:2]
            x_offset = x + (cell_width - img_w) // 2
            y_offset = y + 50  # Leave space for label at top

            gallery[y_offset:y_offset+img_h, x_offset:x_offset+img_w] = img

            # Add label
            cv2.putText(
                gallery,
                name,
                (x + 10, y + 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 0, 0),
                2
            )

        # Save gallery
        cv2.imwrite(output_path, gallery)
