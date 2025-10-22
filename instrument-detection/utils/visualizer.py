"""
Video visualization module
Draws bounding boxes and labels on video frames
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple
import random


class VideoVisualizer:
    """Visualizes detection and tracking results on video"""

    # Color palette for different tracks
    COLORS = [
        (255, 0, 0),      # Red
        (0, 255, 0),      # Green
        (0, 0, 255),      # Blue
        (255, 255, 0),    # Cyan
        (255, 0, 255),    # Magenta
        (0, 255, 255),    # Yellow
        (128, 0, 128),    # Purple
        (255, 128, 0),    # Orange
        (0, 128, 255),    # Light Blue
        (128, 255, 0),    # Lime
    ]

    def __init__(self):
        """Initialize visualizer"""
        self.track_colors = {}

    def get_track_color(self, track_id: int) -> Tuple[int, int, int]:
        """
        Get consistent color for a track ID

        Args:
            track_id: Track identifier

        Returns:
            BGR color tuple
        """
        if track_id not in self.track_colors:
            color_idx = track_id % len(self.COLORS)
            self.track_colors[track_id] = self.COLORS[color_idx]

        return self.track_colors[track_id]

    def draw_bbox(
        self,
        frame: np.ndarray,
        bbox: List[float],
        label: str,
        color: Tuple[int, int, int],
        thickness: int = 2
    ) -> np.ndarray:
        """
        Draw bounding box with label on frame

        Args:
            frame: Input frame
            bbox: Bounding box [x, y, width, height]
            label: Text label
            color: BGR color
            thickness: Line thickness

        Returns:
            Frame with drawn box
        """
        x, y, w, h = map(int, bbox)

        # Draw rectangle
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, thickness)

        # Prepare label background
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        font_thickness = 2

        (text_width, text_height), baseline = cv2.getTextSize(
            label, font, font_scale, font_thickness
        )

        # Draw label background
        label_y = y - 10 if y - 10 > text_height else y + h + text_height + 10

        cv2.rectangle(
            frame,
            (x, label_y - text_height - 5),
            (x + text_width + 5, label_y + 5),
            color,
            -1
        )

        # Draw label text
        cv2.putText(
            frame,
            label,
            (x + 2, label_y),
            font,
            font_scale,
            (255, 255, 255),
            font_thickness
        )

        return frame

    def annotate_frame(
        self,
        frame: np.ndarray,
        frame_idx: int,
        tracks: List[Dict]
    ) -> np.ndarray:
        """
        Annotate a single frame with all relevant tracks

        Args:
            frame: Input frame
            frame_idx: Frame index
            tracks: List of tracks

        Returns:
            Annotated frame
        """
        annotated = frame.copy()

        # Find detections for this frame
        for track in tracks:
            track_id = track['track_id']
            instrument = track['instrument']

            # Find detection in this frame
            for det in track['detections']:
                if det['frame_idx'] == frame_idx:
                    # Get color for track
                    color = self.get_track_color(track_id)

                    # Create label
                    confidence = det.get('confidence', 0)
                    is_playing = det.get('is_being_played', False)
                    playing_status = "PLAYING" if is_playing else "idle"

                    label = f"#{track_id} {instrument} ({confidence:.2f}) [{playing_status}]"

                    # Draw bounding box
                    annotated = self.draw_bbox(
                        annotated,
                        det['bbox'],
                        label,
                        color,
                        thickness=2
                    )

                    # Draw additional indicator for playing
                    if is_playing:
                        x, y, w, h = map(int, det['bbox'])
                        # Draw a filled circle in top-right corner
                        cv2.circle(annotated, (x + w - 10, y + 10), 5, (0, 255, 0), -1)

                    break

        return annotated

    def create_annotated_video(
        self,
        input_video_path: str,
        tracks: List[Dict],
        output_video_path: str,
        fps: int = 30
    ):
        """
        Create annotated video with bounding boxes

        Args:
            input_video_path: Path to input video
            tracks: List of tracks
            output_video_path: Path to save output video
            fps: Output video FPS
        """
        # Open input video
        cap = cv2.VideoCapture(input_video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {input_video_path}")

        # Get video properties
        original_fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, original_fps, (width, height))

        frame_idx = 0

        while True:
            ret, frame = cap.read()

            if not ret:
                break

            # Annotate frame
            annotated = self.annotate_frame(frame, frame_idx, tracks)

            # Add frame number and timestamp
            timestamp = frame_idx / original_fps
            info_text = f"Frame: {frame_idx} | Time: {timestamp:.2f}s"

            cv2.putText(
                annotated,
                info_text,
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2
            )

            # Write frame
            out.write(annotated)

            frame_idx += 1

        cap.release()
        out.release()

    def create_summary_image(
        self,
        tracks: List[Dict],
        width: int = 1200,
        height: int = 800
    ) -> np.ndarray:
        """
        Create a timeline visualization of all tracks

        Args:
            tracks: List of tracks
            width: Image width
            height: Image height

        Returns:
            Summary image
        """
        # Create blank image
        img = np.ones((height, width, 3), dtype=np.uint8) * 255

        if not tracks:
            cv2.putText(
                img,
                "No tracks found",
                (width // 2 - 100, height // 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 0),
                2
            )
            return img

        # Find max duration
        max_time = max(track['end_time'] for track in tracks)

        if max_time == 0:
            max_time = 1

        # Draw timeline
        margin = 50
        timeline_height = height - 2 * margin
        timeline_width = width - 2 * margin

        # Draw axes
        cv2.line(img, (margin, margin), (margin, height - margin), (0, 0, 0), 2)
        cv2.line(img, (margin, height - margin), (width - margin, height - margin), (0, 0, 0), 2)

        # Draw time labels
        num_time_labels = 5
        for i in range(num_time_labels + 1):
            t = (i / num_time_labels) * max_time
            x = margin + int((i / num_time_labels) * timeline_width)

            cv2.line(img, (x, height - margin), (x, height - margin + 5), (0, 0, 0), 1)
            cv2.putText(
                img,
                f"{t:.1f}s",
                (x - 20, height - margin + 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                (0, 0, 0),
                1
            )

        # Draw tracks
        track_height = timeline_height // (len(tracks) + 1)

        for idx, track in enumerate(tracks):
            y = margin + (idx + 1) * track_height
            track_id = track['track_id']
            instrument = track['instrument']

            # Draw track label
            label = f"#{track_id} {instrument}"
            cv2.putText(
                img,
                label,
                (5, y + 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                (0, 0, 0),
                1
            )

            # Draw track timeline
            start_x = margin + int((track['start_time'] / max_time) * timeline_width)
            end_x = margin + int((track['end_time'] / max_time) * timeline_width)

            color = self.get_track_color(track_id)

            cv2.rectangle(
                img,
                (start_x, y - 10),
                (end_x, y + 10),
                color,
                -1
            )

            # Draw border
            cv2.rectangle(
                img,
                (start_x, y - 10),
                (end_x, y + 10),
                (0, 0, 0),
                1
            )

        # Title
        cv2.putText(
            img,
            "Instrument Timeline",
            (width // 2 - 100, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 0),
            2
        )

        return img
