"""
Export utilities for saving detection results in various formats
"""

import json
from typing import List, Dict
from datetime import datetime


class ResultsExporter:
    """Export detection and tracking results"""

    @staticmethod
    def export_tracks_json(tracks: List[Dict], output_path: str):
        """
        Export tracks to JSON file

        Args:
            tracks: List of tracks
            output_path: Output file path
        """
        # Prepare export data
        export_data = {
            "metadata": {
                "export_time": datetime.now().isoformat(),
                "total_tracks": len(tracks),
                "instruments": list(set(track['instrument'] for track in tracks))
            },
            "tracks": []
        }

        for track in tracks:
            track_data = {
                "track_id": track['track_id'],
                "instrument": track['instrument'],
                "start_time": track['start_time'],
                "end_time": track['end_time'],
                "duration": track['duration'],
                "playing_percentage": track.get('playing_percentage', 0),
                "avg_confidence": track.get('avg_confidence', 0),
                "num_detections": len(track['detections']),
                "segments": ResultsExporter.get_playing_segments(track)
            }

            export_data["tracks"].append(track_data)

        # Write to file
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)

    @staticmethod
    def export_detections_json(detections: List[Dict], output_path: str):
        """
        Export all detections to JSON file

        Args:
            detections: List of detections
            output_path: Output file path
        """
        export_data = {
            "metadata": {
                "export_time": datetime.now().isoformat(),
                "total_detections": len(detections)
            },
            "detections": detections
        }

        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)

    @staticmethod
    def get_playing_segments(track: Dict) -> List[Dict]:
        """
        Extract continuous segments where instrument is being played

        Args:
            track: Track dictionary

        Returns:
            List of playing segments with start/end times
        """
        if not track['detections']:
            return []

        segments = []
        in_segment = False
        segment_start = None

        for det in sorted(track['detections'], key=lambda x: x['timestamp']):
            is_playing = det.get('is_being_played', False)
            timestamp = det['timestamp']

            if is_playing and not in_segment:
                # Start new segment
                segment_start = timestamp
                in_segment = True
            elif not is_playing and in_segment:
                # End segment
                segments.append({
                    "start_time": segment_start,
                    "end_time": timestamp,
                    "duration": timestamp - segment_start
                })
                in_segment = False

        # Close open segment
        if in_segment:
            segments.append({
                "start_time": segment_start,
                "end_time": track['detections'][-1]['timestamp'],
                "duration": track['detections'][-1]['timestamp'] - segment_start
            })

        return segments

    @staticmethod
    def export_summary_txt(tracks: List[Dict], output_path: str):
        """
        Export human-readable summary to text file

        Args:
            tracks: List of tracks
            output_path: Output file path
        """
        with open(output_path, 'w') as f:
            f.write("=" * 60 + "\n")
            f.write("VISUAL INSTRUMENT DETECTION SUMMARY\n")
            f.write("=" * 60 + "\n\n")

            f.write(f"Total Tracks: {len(tracks)}\n")
            f.write(f"Export Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

            # Group by instrument
            instruments = {}
            for track in tracks:
                inst = track['instrument']
                if inst not in instruments:
                    instruments[inst] = []
                instruments[inst].append(track)

            f.write("Instruments Detected:\n")
            for inst, inst_tracks in instruments.items():
                f.write(f"  - {inst}: {len(inst_tracks)} track(s)\n")

            f.write("\n" + "=" * 60 + "\n")
            f.write("DETAILED TRACKS\n")
            f.write("=" * 60 + "\n\n")

            for track in sorted(tracks, key=lambda x: x['start_time']):
                f.write(f"Track #{track['track_id']}: {track['instrument']}\n")
                f.write(f"  Time Range: {track['start_time']:.2f}s - {track['end_time']:.2f}s\n")
                f.write(f"  Duration: {track['duration']:.2f}s\n")
                f.write(f"  Detections: {len(track['detections'])}\n")
                f.write(f"  Average Confidence: {track.get('avg_confidence', 0):.2f}\n")
                f.write(f"  Playing: {track.get('playing_percentage', 0):.1f}% of time\n")

                # Playing segments
                segments = ResultsExporter.get_playing_segments(track)
                if segments:
                    f.write(f"  Playing Segments:\n")
                    for seg in segments:
                        f.write(f"    - {seg['start_time']:.2f}s to {seg['end_time']:.2f}s "
                                f"({seg['duration']:.2f}s)\n")

                f.write("\n")

    @staticmethod
    def export_csv(tracks: List[Dict], output_path: str):
        """
        Export tracks to CSV format

        Args:
            tracks: List of tracks
            output_path: Output file path
        """
        import csv

        with open(output_path, 'w', newline='') as f:
            writer = csv.writer(f)

            # Header
            writer.writerow([
                'Track ID',
                'Instrument',
                'Start Time (s)',
                'End Time (s)',
                'Duration (s)',
                'Num Detections',
                'Avg Confidence',
                'Playing %'
            ])

            # Data rows
            for track in tracks:
                writer.writerow([
                    track['track_id'],
                    track['instrument'],
                    f"{track['start_time']:.2f}",
                    f"{track['end_time']:.2f}",
                    f"{track['duration']:.2f}",
                    len(track['detections']),
                    f"{track.get('avg_confidence', 0):.2f}",
                    f"{track.get('playing_percentage', 0):.1f}"
                ])
