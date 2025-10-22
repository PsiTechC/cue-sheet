"""
Video frame sampling utility
Extracts frames from video at specified FPS
"""

import cv2
import numpy as np
from typing import List, Dict
import base64


class VideoProcessor:
    """Handles video frame extraction and preprocessing"""

    def sample_frames(self, video_path: str, target_fps: int = 3, max_dimension: int = 1280) -> List[Dict]:
        """
        Sample frames from video at target FPS with optional resizing

        Args:
            video_path: Path to video file
            target_fps: Frames per second to sample
            max_dimension: Maximum width or height (0 = no resize)

        Returns:
            List of dicts containing frame data:
            {
                'frame': numpy array,
                'frame_idx': int,
                'timestamp': float,
                'frame_shape': tuple
            }
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        # Get video properties
        original_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if original_fps == 0:
            raise ValueError("Could not determine video FPS")

        # Calculate frame interval
        frame_interval = max(1, int(original_fps / target_fps))

        frames_data = []
        frame_idx = 0

        while True:
            ret, frame = cap.read()

            if not ret:
                break

            # Sample frame based on interval
            if frame_idx % frame_interval == 0:
                timestamp = frame_idx / original_fps

                # Resize if needed
                if max_dimension > 0:
                    frame = self.resize_frame(frame, max_dimension)

                frames_data.append({
                    'frame': frame,
                    'frame_idx': frame_idx,
                    'timestamp': timestamp,
                    'frame_shape': frame.shape
                })

            frame_idx += 1

        cap.release()

        return frames_data

    def encode_frame_to_base64(self, frame: np.ndarray, quality: int = 85) -> str:
        """
        Encode frame to base64 JPEG for API transmission

        Args:
            frame: Numpy array (BGR format from OpenCV)
            quality: JPEG quality (0-100)

        Returns:
            Base64 encoded string
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Encode as JPEG
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        _, buffer = cv2.imencode('.jpg', frame_rgb, encode_param)

        # Convert to base64
        base64_str = base64.b64encode(buffer).decode('utf-8')

        return base64_str

    def get_video_info(self, video_path: str) -> Dict:
        """
        Get video metadata

        Args:
            video_path: Path to video file

        Returns:
            Dict with video properties
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        info = {
            'fps': cap.get(cv2.CAP_PROP_FPS),
            'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'duration': cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
        }

        cap.release()

        return info

    def resize_frame(self, frame: np.ndarray, max_dimension: int = 1024) -> np.ndarray:
        """
        Resize frame while maintaining aspect ratio

        Args:
            frame: Input frame
            max_dimension: Maximum width or height

        Returns:
            Resized frame
        """
        h, w = frame.shape[:2]

        if max(h, w) <= max_dimension:
            return frame

        # Calculate scaling factor
        if h > w:
            new_h = max_dimension
            new_w = int(w * (max_dimension / h))
        else:
            new_w = max_dimension
            new_h = int(h * (max_dimension / w))

        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

        return resized
