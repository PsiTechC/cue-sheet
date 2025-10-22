"""
Comprehensive exporter that creates a single JSON with all instrument metadata
Includes tracks, detections, and consolidated unique instruments
"""

import json
from typing import List, Dict
from datetime import datetime


class ComprehensiveExporter:
    """Export all instrument data in a single comprehensive JSON file"""

    @staticmethod
    def export_complete_analysis(
        tracks: List[Dict],
        all_detections: List[Dict],
        consolidated_instruments: Dict[str, Dict],
        video_metadata: Dict,
        output_path: str
    ):
        """
        Export complete instrument analysis to a single JSON file

        Args:
            tracks: All instrument tracks
            all_detections: All frame-level detections
            consolidated_instruments: Unique instruments with metadata
            video_metadata: Video file information
            output_path: Output JSON file path
        """
        # Build comprehensive export structure
        export_data = {
            "metadata": {
                "export_time": datetime.now().isoformat(),
                "video_info": video_metadata,
                "analysis_summary": {
                    "total_frames_analyzed": len(set(det['frame_idx'] for det in all_detections)),
                    "total_detections": len(all_detections),
                    "total_tracks": len(tracks),
                    "unique_instruments": len(consolidated_instruments),
                    "instruments_detected": list(consolidated_instruments.keys())
                }
            },
            "unique_instruments": ComprehensiveExporter._format_unique_instruments(consolidated_instruments),
            "tracks": ComprehensiveExporter._format_tracks(tracks),
            "frame_detections": ComprehensiveExporter._format_detections_by_frame(all_detections)
        }

        # Write to file
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)

    @staticmethod
    def _format_unique_instruments(consolidated: Dict[str, Dict]) -> List[Dict]:
        """Format consolidated unique instruments for export"""
        unique_instruments = []

        for instrument_key, data in sorted(consolidated.items(), key=lambda x: x[1]['first_seen']):
            instrument_info = {
                "instrument_name": data['instrument'],
                "statistics": {
                    "number_of_tracks": data['num_tracks'],
                    "total_detections": data['total_detections'],
                    "first_seen_at": f"{data['first_seen']:.2f}s",
                    "last_seen_at": f"{data['last_seen']:.2f}s",
                    "time_span": f"{data['time_span']:.2f}s",
                    "average_confidence": f"{data['avg_confidence']:.3f}",
                    "playing_percentage": f"{data['playing_percentage']:.1f}%"
                },
                "best_detection": {
                    "frame_index": data['best_detection']['frame_idx'],
                    "timestamp": f"{data['best_detection']['timestamp']:.2f}s",
                    "confidence": f"{data['best_detection']['confidence']:.3f}",
                    "bbox": data['best_detection']['bbox'],
                    "is_being_played": data['best_detection'].get('is_being_played', False)
                } if data['best_detection'] else None,
                "all_track_ids": [track['track_id'] for track in data['tracks']]
            }

            unique_instruments.append(instrument_info)

        return unique_instruments

    @staticmethod
    def _format_tracks(tracks: List[Dict]) -> List[Dict]:
        """Format tracks for export"""
        formatted_tracks = []

        for track in sorted(tracks, key=lambda x: x['start_time']):
            track_info = {
                "track_id": track['track_id'],
                "instrument": track['instrument'],
                "temporal_info": {
                    "start_time": f"{track['start_time']:.2f}s",
                    "end_time": f"{track['end_time']:.2f}s",
                    "duration": f"{track['duration']:.2f}s"
                },
                "statistics": {
                    "num_detections": track['num_detections'],
                    "average_confidence": f"{track['avg_confidence']:.3f}",
                    "playing_percentage": f"{track['playing_percentage']:.1f}%"
                },
                "detections_summary": [
                    {
                        "frame_index": det['frame_idx'],
                        "timestamp": f"{det['timestamp']:.2f}s",
                        "confidence": f"{det['confidence']:.3f}",
                        "bbox": det['bbox'],
                        "is_being_played": det.get('is_being_played', False)
                    }
                    for det in track['detections']
                ]
            }

            formatted_tracks.append(track_info)

        return formatted_tracks

    @staticmethod
    def _format_detections_by_frame(all_detections: List[Dict]) -> List[Dict]:
        """Format all detections grouped by frame"""
        # Group by frame
        detections_by_frame = {}
        for det in all_detections:
            frame_idx = det['frame_idx']
            if frame_idx not in detections_by_frame:
                detections_by_frame[frame_idx] = {
                    'frame_index': frame_idx,
                    'timestamp': f"{det['timestamp']:.2f}s",
                    'detections': []
                }

            detections_by_frame[frame_idx]['detections'].append({
                'instrument': det['instrument'],
                'confidence': f"{det['confidence']:.3f}",
                'bbox': det['bbox'],
                'is_being_played': det.get('is_being_played', False),
                'notes': det.get('notes', '')
            })

        # Sort by frame index
        return [detections_by_frame[idx] for idx in sorted(detections_by_frame.keys())]

    @staticmethod
    def export_simple_summary(
        consolidated_instruments: Dict[str, Dict],
        output_path: str
    ):
        """
        Export a simplified summary with just unique instruments

        Args:
            consolidated_instruments: Unique instruments with metadata
            output_path: Output JSON file path
        """
        summary = {
            "export_time": datetime.now().isoformat(),
            "total_unique_instruments": len(consolidated_instruments),
            "instruments": []
        }

        for instrument_key, data in sorted(consolidated_instruments.items(), key=lambda x: x[1]['first_seen']):
            summary['instruments'].append({
                "name": data['instrument'],
                "first_seen": f"{data['first_seen']:.2f}s",
                "last_seen": f"{data['last_seen']:.2f}s",
                "duration": f"{data['time_span']:.2f}s",
                "confidence": f"{data['avg_confidence']:.3f}",
                "playing_percentage": f"{data['playing_percentage']:.1f}%",
                "number_of_appearances": data['total_detections']
            })

        with open(output_path, 'w') as f:
            json.dump(summary, f, indent=2)
