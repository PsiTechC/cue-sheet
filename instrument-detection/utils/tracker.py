"""
Instrument tracking using IoU (Intersection over Union) and Hungarian algorithm
Stitches detections across frames into temporal tracks
"""

import numpy as np
from typing import List, Dict, Tuple
from scipy.optimize import linear_sum_assignment


class InstrumentTracker:
    """Tracks instruments across video frames using IoU matching"""

    def __init__(
        self,
        iou_threshold: float = 0.3,
        max_frames_to_skip: int = 5
    ):
        """
        Initialize tracker

        Args:
            iou_threshold: Minimum IoU to consider a match
            max_frames_to_skip: Maximum frames a track can be undetected before termination
        """
        self.iou_threshold = iou_threshold
        self.max_frames_to_skip = max_frames_to_skip
        self.next_track_id = 0

    def calculate_iou(self, bbox1: List[float], bbox2: List[float]) -> float:
        """
        Calculate Intersection over Union for two bounding boxes

        Args:
            bbox1, bbox2: Bounding boxes in format [x, y, width, height]

        Returns:
            IoU score (0.0 to 1.0)
        """
        x1, y1, w1, h1 = bbox1
        x2, y2, w2, h2 = bbox2

        # Calculate intersection
        x_left = max(x1, x2)
        y_top = max(y1, y2)
        x_right = min(x1 + w1, x2 + w2)
        y_bottom = min(y1 + h1, y2 + h2)

        if x_right < x_left or y_bottom < y_top:
            return 0.0

        intersection_area = (x_right - x_left) * (y_bottom - y_top)

        # Calculate union
        bbox1_area = w1 * h1
        bbox2_area = w2 * h2
        union_area = bbox1_area + bbox2_area - intersection_area

        if union_area == 0:
            return 0.0

        iou = intersection_area / union_area

        return iou

    def match_detections_to_tracks(
        self,
        detections: List[Dict],
        active_tracks: List[Dict]
    ) -> Tuple[List[Tuple[int, int]], List[int], List[int]]:
        """
        Match current detections to active tracks using Hungarian algorithm

        Args:
            detections: List of current frame detections
            active_tracks: List of active tracks

        Returns:
            Tuple of (matches, unmatched_detections, unmatched_tracks)
            - matches: List of (detection_idx, track_idx) pairs
            - unmatched_detections: List of detection indices
            - unmatched_tracks: List of track indices
        """
        if len(detections) == 0 or len(active_tracks) == 0:
            return [], list(range(len(detections))), list(range(len(active_tracks)))

        # Build cost matrix (negative IoU for maximization)
        cost_matrix = np.zeros((len(detections), len(active_tracks)))

        for i, det in enumerate(detections):
            for j, track in enumerate(active_tracks):
                # Only match same instrument types
                if det['instrument'].lower() == track['instrument'].lower():
                    # Use last bbox from track
                    last_bbox = track['detections'][-1]['bbox']
                    iou = self.calculate_iou(det['bbox'], last_bbox)
                    cost_matrix[i, j] = -iou  # Negative for minimization
                else:
                    cost_matrix[i, j] = 1.0  # High cost for mismatched instruments

        # Apply Hungarian algorithm
        row_indices, col_indices = linear_sum_assignment(cost_matrix)

        # Filter matches by IoU threshold
        matches = []
        unmatched_detections = list(range(len(detections)))
        unmatched_tracks = list(range(len(active_tracks)))

        for row, col in zip(row_indices, col_indices):
            iou = -cost_matrix[row, col]

            if iou >= self.iou_threshold:
                matches.append((row, col))
                unmatched_detections.remove(row)
                unmatched_tracks.remove(col)

        return matches, unmatched_detections, unmatched_tracks

    def track(
        self,
        all_detections: List[Dict],
        frames_data: List[Dict]
    ) -> List[Dict]:
        """
        Track instruments across all frames

        Args:
            all_detections: All detections with 'frame_idx' and 'timestamp'
            frames_data: Frame metadata

        Returns:
            List of tracks with structure:
            {
                'track_id': int,
                'instrument': str,
                'detections': List[Dict],
                'start_time': float,
                'end_time': float,
                'duration': float,
                'playing_percentage': float (0-100)
            }
        """
        # Group detections by frame
        detections_by_frame = {}
        for det in all_detections:
            frame_idx = det['frame_idx']
            if frame_idx not in detections_by_frame:
                detections_by_frame[frame_idx] = []
            detections_by_frame[frame_idx].append(det)

        # Active tracks
        active_tracks = []
        completed_tracks = []

        # Process frames in order
        sorted_frames = sorted(frames_data, key=lambda x: x['frame_idx'])

        for frame_data in sorted_frames:
            frame_idx = frame_data['frame_idx']
            current_detections = detections_by_frame.get(frame_idx, [])

            # Match detections to tracks
            matches, unmatched_dets, unmatched_tracks = self.match_detections_to_tracks(
                current_detections,
                active_tracks
            )

            # Update matched tracks
            for det_idx, track_idx in matches:
                active_tracks[track_idx]['detections'].append(current_detections[det_idx])
                active_tracks[track_idx]['frames_since_update'] = 0

            # Create new tracks for unmatched detections
            for det_idx in unmatched_dets:
                new_track = {
                    'track_id': self.next_track_id,
                    'instrument': current_detections[det_idx]['instrument'],
                    'detections': [current_detections[det_idx]],
                    'frames_since_update': 0
                }
                self.next_track_id += 1
                active_tracks.append(new_track)

            # Increment frames_since_update for unmatched tracks
            tracks_to_remove = []
            for track_idx in unmatched_tracks:
                active_tracks[track_idx]['frames_since_update'] += 1

                # Remove tracks that haven't been updated
                if active_tracks[track_idx]['frames_since_update'] > self.max_frames_to_skip:
                    tracks_to_remove.append(track_idx)

            # Move stale tracks to completed
            for track_idx in sorted(tracks_to_remove, reverse=True):
                completed_tracks.append(active_tracks.pop(track_idx))

        # Move remaining active tracks to completed
        completed_tracks.extend(active_tracks)

        # Post-process tracks
        final_tracks = []
        for track in completed_tracks:
            if len(track['detections']) == 0:
                continue

            # Calculate temporal info
            timestamps = [det['timestamp'] for det in track['detections']]
            start_time = min(timestamps)
            end_time = max(timestamps)
            duration = end_time - start_time

            # Calculate playing percentage
            playing_count = sum(
                1 for det in track['detections']
                if det.get('is_being_played', False)
            )
            playing_percentage = (playing_count / len(track['detections'])) * 100 if track['detections'] else 0

            # Calculate average confidence
            avg_confidence = np.mean([det.get('confidence', 0) for det in track['detections']])

            final_track = {
                'track_id': track['track_id'],
                'instrument': track['instrument'],
                'detections': track['detections'],
                'start_time': start_time,
                'end_time': end_time,
                'duration': duration,
                'playing_percentage': playing_percentage,
                'avg_confidence': float(avg_confidence),
                'num_detections': len(track['detections'])
            }

            final_tracks.append(final_track)

        # Sort tracks by start time
        final_tracks.sort(key=lambda x: x['start_time'])

        return final_tracks

    def get_track_segments(self, track: Dict) -> List[Dict]:
        """
        Split track into continuous segments (when playing status changes)

        Args:
            track: Track dictionary

        Returns:
            List of segments with start/end times and playing status
        """
        if not track['detections']:
            return []

        segments = []
        current_segment = {
            'start_time': track['detections'][0]['timestamp'],
            'is_playing': track['detections'][0].get('is_being_played', False),
            'detections': [track['detections'][0]]
        }

        for det in track['detections'][1:]:
            is_playing = det.get('is_being_played', False)

            if is_playing == current_segment['is_playing']:
                # Continue current segment
                current_segment['detections'].append(det)
            else:
                # Close current segment
                current_segment['end_time'] = current_segment['detections'][-1]['timestamp']
                segments.append(current_segment)

                # Start new segment
                current_segment = {
                    'start_time': det['timestamp'],
                    'is_playing': is_playing,
                    'detections': [det]
                }

        # Close last segment
        current_segment['end_time'] = current_segment['detections'][-1]['timestamp']
        segments.append(current_segment)

        return segments
