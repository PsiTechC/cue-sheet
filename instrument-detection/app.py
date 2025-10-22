"""
Instrument Detection Microservice
Flask-based REST API for detecting musical instruments in videos
"""

import os
import uuid
import shutil
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import threading
from datetime import datetime
import json

# Import MongoDB models
from models import DetectionResult, UserMinutes

# Import detection utilities
from utils.video_processor import VideoProcessor
from utils.openai_detector import OpenAIInstrumentDetector
from utils.owlvit_detector import OwlViTInstrumentDetector
from utils.tracker import InstrumentTracker
from utils.consolidator import InstrumentConsolidator
from utils.comprehensive_exporter import ComprehensiveExporter

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads/videos'
RESULTS_FOLDER = 'uploads/results'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULTS_FOLDER'] = RESULTS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# CORS configuration
frontend_url = os.getenv('REACT_FE', 'http://localhost:3000')
CORS(app, resources={r"/*": {"origins": frontend_url}})

# Ensure upload and results folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# OpenAI API Key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    print("WARNING: OPENAI_API_KEY not found in environment variables!")

# Detection status tracker (in-memory for quick access)
detection_status = {}

# MongoDB models
detection_result_model = DetectionResult()
user_minutes_model = UserMinutes()


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def cleanup_old_files(directory, max_age_hours=24):
    """Clean up files older than specified hours"""
    try:
        current_time = datetime.now().timestamp()
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if os.path.isfile(filepath):
                file_age = current_time - os.path.getmtime(filepath)
                if file_age > (max_age_hours * 3600):
                    os.remove(filepath)
                    print(f"Cleaned up old file: {filepath}")
            elif os.path.isdir(filepath):
                shutil.rmtree(filepath)
                print(f"Cleaned up old directory: {filepath}")
    except Exception as e:
        print(f"Error during cleanup: {e}")


def process_video_detection(job_id, video_path, options):
    """
    Background task for processing video detection

    Args:
        job_id: Unique job identifier
        video_path: Path to uploaded video
        options: Detection configuration options
    """
    try:
        detection_status[job_id]['status'] = 'processing'
        detection_status[job_id]['progress'] = 0

        # Update MongoDB
        try:
            detection_result_model.update_status(job_id, 'processing', progress=0)
        except Exception as e:
            print(f"Warning: Could not update MongoDB: {e}")

        # Step 1: Sample frames from video
        print(f"[{job_id}] Sampling frames from video...")
        video_processor = VideoProcessor()

        frames_data = video_processor.sample_frames(
            video_path,
            target_fps=options.get('fps', 0.5),
            max_dimension=options.get('max_resolution', 1280)
        )

        video_info = video_processor.get_video_info(video_path)
        detection_status[job_id]['progress'] = 20
        detection_status[job_id]['total_frames'] = len(frames_data)

        print(f"[{job_id}] Sampled {len(frames_data)} frames")

        # Step 2: Detect instruments
        print(f"[{job_id}] Detecting instruments...")
        detection_method = options.get('method', 'owlvit')

        if detection_method == 'openai':
            detector = OpenAIInstrumentDetector(
                api_key=OPENAI_API_KEY,
                model=options.get('model', 'gpt-4o'),
                max_workers=options.get('max_workers', 5)
            )
        else:  # owlvit (default)
            detector = OwlViTInstrumentDetector(
                api_key=OPENAI_API_KEY,
                model=options.get('model', 'gpt-4o'),
                image_detail=options.get('image_detail', 'low')
            )

        # Both detectors have the same batch_detect_with_metadata signature
        detections = detector.batch_detect_with_metadata(
            frames_data,
            detect_playing=options.get('detect_playing', True),
            confidence_threshold=options.get('confidence', 0.5),
            skip_similar=options.get('skip_similar', True)
        )

        detection_status[job_id]['progress'] = 60
        print(f"[{job_id}] Detected {len(detections)} total detections")

        # Step 3: Track instruments across frames
        print(f"[{job_id}] Tracking instruments...")
        tracker = InstrumentTracker(
            iou_threshold=0.3,
            max_frames_to_skip=5
        )
        tracks = tracker.track(detections, frames_data)
        detection_status[job_id]['progress'] = 80

        print(f"[{job_id}] Created {len(tracks)} tracks")

        # Step 4: Consolidate by instrument type
        print(f"[{job_id}] Consolidating instruments...")
        consolidator = InstrumentConsolidator()
        consolidated = consolidator.consolidate_tracks_by_instrument(
            tracks,
            video_path
        )

        detection_status[job_id]['progress'] = 90

        # Step 5: Export results
        print(f"[{job_id}] Exporting results...")
        exporter = ComprehensiveExporter()

        # Create job results folder
        job_results_folder = os.path.join(app.config['RESULTS_FOLDER'], job_id)
        os.makedirs(job_results_folder, exist_ok=True)

        # Export comprehensive JSON
        json_path = os.path.join(job_results_folder, 'analysis.json')
        exporter.export_complete_analysis(
            tracks=tracks,
            all_detections=detections,
            consolidated_instruments=consolidated,
            video_metadata=video_info,
            output_path=json_path
        )

        # Save instrument images by extracting crops from frames_data
        import cv2
        instrument_images = {}

        print(f"[{job_id}] Extracting images for {len(consolidated)} instruments...")

        for instrument_name, data in consolidated.items():
            print(f"[{job_id}] Processing {instrument_name}...")
            if 'best_detection' in data and data['best_detection']:
                best_det = data['best_detection']
                frame_idx = best_det.get('frame_idx')
                bbox = best_det.get('bbox')
                print(f"[{job_id}]   - Frame idx: {frame_idx}, BBox: {bbox}")

                if bbox:
                    # Reuse consolidator helper to grab the best instrument-only crop from source video
                    try:
                        cropped = InstrumentConsolidator.get_best_frame_for_instrument(
                            video_path,
                            data,
                            target_size=(300, 300),
                            padding_pixels=2,
                            maintain_aspect=True
                        )
                    except Exception as crop_error:
                        print(f"[{job_id}]   ✗ Failed to load frame for cropping: {crop_error}")
                        cropped = None

                    if cropped is not None and cropped.size > 0:
                        # Save cropped image
                        img_filename = f"{instrument_name.replace(' ', '_')}.jpg"
                        img_path = os.path.join(job_results_folder, img_filename)
                        success = cv2.imwrite(img_path, cropped)
                        if success:
                            instrument_images[instrument_name] = img_filename
                            print(f"[{job_id}]   ✓ Saved image: {img_filename} ({cropped.shape[1]}x{cropped.shape[0]})")
                        else:
                            print(f"[{job_id}]   ✗ Failed to save image: {img_filename}")
                    else:
                        print(f"[{job_id}]   ✗ Cropped image is empty")
                else:
                    print(f"[{job_id}]   ✗ BBox missing for instrument")
            else:
                print(f"[{job_id}]   ✗ No best_detection found")

        print(f"[{job_id}] Successfully saved {len(instrument_images)} images")

        # Prepare detailed instrument metadata
        instruments_metadata = {}
        for instrument_name, data in consolidated.items():
            instruments_metadata[instrument_name] = {
                'name': instrument_name,
                'image': instrument_images.get(instrument_name),
                'confidence': round(data.get('avg_confidence', 0), 3),
                'track_count': data.get('num_tracks', 0),
                'detection_count': data.get('total_detections', 0),
                'first_seen': round(data.get('first_seen', 0), 2),
                'last_seen': round(data.get('last_seen', 0), 2),
                'duration': round(data.get('total_duration', 0), 2),
                'playing_percentage': round(data.get('playing_percentage', 0), 2)
            }

        # Prepare results
        results_data = {
            'json_file': os.path.basename(json_path),
            'instrument_images': instrument_images,
            'instruments_metadata': instruments_metadata,
            'summary': {
                'total_instruments': len(consolidated),
                'total_tracks': len(tracks),
                'total_detections': len(detections),
                'instruments_detected': list(consolidated.keys())
            }
        }

        # Update status with results
        detection_status[job_id]['status'] = 'completed'
        detection_status[job_id]['progress'] = 100
        detection_status[job_id]['results'] = results_data

        # Update MongoDB
        try:
            detection_result_model.update_results(job_id, results_data)

            # Deduct user minutes if applicable
            if video_info and 'duration' in video_info:
                video_minutes = int(video_info['duration'] / 60) + 1
                user_minutes_model.deduct_minutes(options.get('user_id', 'anonymous'), video_minutes)
        except Exception as e:
            print(f"Warning: Could not update MongoDB: {e}")

        print(f"[{job_id}] Processing completed successfully")

    except Exception as e:
        print(f"[{job_id}] Error during processing: {str(e)}")
        detection_status[job_id]['status'] = 'failed'
        detection_status[job_id]['error'] = str(e)
        import traceback
        detection_status[job_id]['traceback'] = traceback.format_exc()

        # Update MongoDB
        try:
            detection_result_model.update_status(job_id, 'failed', error=str(e))
        except Exception as db_error:
            print(f"Warning: Could not update MongoDB: {db_error}")


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        "service": "Instrument Detection Microservice",
        "status": "running",
        "version": "1.0.0"
    })


@app.route('/upload', methods=['POST'])
def upload_video():
    """
    Upload video file for instrument detection

    Expected form data:
        - file: Video file
        - userId: User ID (optional)
        - fps: Frame sampling rate (default: 0.5)
        - method: Detection method ('openai' or 'owlvit', default: 'owlvit')
        - model: OpenAI model ('gpt-4o' or 'gpt-4o-mini', default: 'gpt-4o')
        - confidence: Confidence threshold (default: 0.5)
        - detect_playing: Detect playing status (default: true)
        - max_workers: Parallel workers (default: 5)
        - max_resolution: Max frame resolution (default: 1280)
        - skip_similar: Skip similar frames (default: true)
        - skip_duplicates: Skip duplicate objects (default: true)
        - image_detail: Image detail level (default: 'low')

    Returns:
        JSON with job_id for tracking
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({"error": "No file part in request"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

        # Generate job ID
        job_id = str(uuid.uuid4())
        user_id = request.form.get('userId', 'anonymous')

        # Save uploaded file
        filename = secure_filename(file.filename)
        job_folder = os.path.join(app.config['UPLOAD_FOLDER'], job_id)
        os.makedirs(job_folder, exist_ok=True)

        video_path = os.path.join(job_folder, filename)
        file.save(video_path)

        print(f"[{job_id}] Video uploaded: {filename} by user: {user_id}")

        # Parse detection options
        options = {
            'fps': float(request.form.get('fps', 0.5)),
            'method': request.form.get('method', 'owlvit'),
            'model': request.form.get('model', 'gpt-4o'),
            'confidence': float(request.form.get('confidence', 0.5)),
            'detect_playing': request.form.get('detect_playing', 'true').lower() == 'true',
            'max_workers': int(request.form.get('max_workers', 5)),
            'max_resolution': int(request.form.get('max_resolution', 1280)),
            'skip_similar': request.form.get('skip_similar', 'true').lower() == 'true',
            'skip_duplicates': request.form.get('skip_duplicates', 'true').lower() == 'true',
            'image_detail': request.form.get('image_detail', 'low')
        }

        # Initialize detection status (in-memory)
        detection_status[job_id] = {
            'job_id': job_id,
            'user_id': user_id,
            'filename': filename,
            'status': 'queued',
            'progress': 0,
            'created_at': datetime.now().isoformat(),
            'options': options
        }

        # Save to MongoDB
        try:
            detection_result_model.create({
                'job_id': job_id,
                'user_id': user_id,
                'filename': filename,
                'status': 'queued',
                'progress': 0,
                'options': options
            })
        except Exception as e:
            print(f"Warning: Could not save to MongoDB: {e}")

        # Start background processing
        thread = threading.Thread(
            target=process_video_detection,
            args=(job_id, video_path, options),
            daemon=True
        )
        thread.start()

        return jsonify({
            "success": True,
            "job_id": job_id,
            "message": "Video uploaded successfully. Processing started.",
            "filename": filename
        }), 200

    except Exception as e:
        print(f"Error in upload_video: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """
    Get detection job status

    Returns:
        JSON with job status and progress
    """
    if job_id not in detection_status:
        return jsonify({"error": "Job ID not found"}), 404

    return jsonify(detection_status[job_id]), 200


@app.route('/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """
    Get detection results for completed job

    Returns:
        JSON with detection results
    """
    if job_id not in detection_status:
        return jsonify({"error": "Job ID not found"}), 404

    status = detection_status[job_id]

    if status['status'] != 'completed':
        return jsonify({
            "error": "Job not completed",
            "status": status['status'],
            "progress": status.get('progress', 0)
        }), 400

    return jsonify({
        "job_id": job_id,
        "status": "completed",
        "results": status.get('results', {})
    }), 200


@app.route('/download/<job_id>/<filename>', methods=['GET'])
def download_file(job_id, filename):
    """
    Download result files (JSON or images)

    Args:
        job_id: Job identifier
        filename: File to download
    """
    if job_id not in detection_status:
        return jsonify({"error": "Job ID not found"}), 404

    file_path = os.path.join(app.config['RESULTS_FOLDER'], job_id, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    # Serve images inline, other files as attachments
    is_image = filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))
    return send_file(file_path, as_attachment=not is_image, mimetype='image/jpeg' if is_image else None)


@app.route('/cleanup/<job_id>', methods=['DELETE'])
def cleanup_job(job_id):
    """
    Clean up job files and status

    Args:
        job_id: Job identifier
    """
    try:
        # Remove from status tracker
        if job_id in detection_status:
            del detection_status[job_id]

        # Remove upload folder
        upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], job_id)
        if os.path.exists(upload_folder):
            shutil.rmtree(upload_folder)

        # Remove results folder
        results_folder = os.path.join(app.config['RESULTS_FOLDER'], job_id)
        if os.path.exists(results_folder):
            shutil.rmtree(results_folder)

        return jsonify({"success": True, "message": "Job cleaned up successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/jobs', methods=['GET'])
def list_jobs():
    """
    List all active jobs

    Returns:
        JSON with list of jobs
    """
    jobs = []
    for job_id, status in detection_status.items():
        jobs.append({
            'job_id': job_id,
            'status': status.get('status'),
            'progress': status.get('progress', 0),
            'created_at': status.get('created_at'),
            'filename': status.get('filename')
        })

    return jsonify({"jobs": jobs}), 200


# Periodic cleanup task
def start_cleanup_scheduler():
    """Start background cleanup scheduler"""
    import schedule
    import time

    schedule.every(6).hours.do(lambda: cleanup_old_files(app.config['UPLOAD_FOLDER'], 24))
    schedule.every(6).hours.do(lambda: cleanup_old_files(app.config['RESULTS_FOLDER'], 24))

    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour


# Start cleanup scheduler in background
cleanup_thread = threading.Thread(target=start_cleanup_scheduler, daemon=True)
cleanup_thread.start()


if __name__ == "__main__":
    port = int(os.getenv('PORT', 8001))
    print(f"Starting Instrument Detection Microservice on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
