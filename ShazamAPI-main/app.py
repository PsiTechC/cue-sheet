import os
import uuid
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from split_audio import split_audio_file
from mutagen.mp3 import MP3
from flask_cors import CORS
import time
import re
from dotenv import load_dotenv
import threading
import clear 
from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from botocore.exceptions import ClientError


scheduler_thread = threading.Thread(target=clear.start_scheduler, daemon=True)
scheduler_thread.start()


print("running...")
app = Flask(__name__)
frontend_url = os.getenv('REACT_FE_P', 'http://localhost:3000')  
CORS(app, resources={r"/*": {"origins": frontend_url}})
app.config['UPLOAD_FOLDER'] = 'ShazamAPI/eps'
app.config['CHUNKS_FOLDER'] = 'ShazamAPI/chunks'

total_chunks = 0
processed_chunks = 1
video_duration = None  

load_dotenv()
AUDD_API_KEY = os.getenv("AUDD_API_KEY")

if not AUDD_API_KEY:
    raise ValueError("API Key not found in environment variables!")


import warnings
warnings.filterwarnings(
    "ignore",
    message=".*torch.load.*weights_only=False.*",
    category=FutureWarning
)


@app.route('/')
def index():
    return "Hello, World!"

def clear_folder(folder_path):
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)  
                print(f"Deleted file: {file_path}")
            elif os.path.isdir(file_path):
                clear_folder(file_path)
                os.rmdir(file_path)  
                print(f"Deleted directory: {file_path}")
        except Exception as e:
            print(f"Failed to delete {file_path}. Reason: {e}")



def extract_chunk_number(filename):
    match = re.search(r'chunk(\d+)', filename)
    return int(match.group(1)) if match else float('inf')  


@app.route('/upload', methods=['POST'])
def upload_file():
    global total_chunks, processed_chunks, video_duration

    user_id = str(uuid.uuid4())  
    user_chunks_folder = os.path.join(app.config['CHUNKS_FOLDER'], user_id)
    user_eps_folder = os.path.join(app.config['UPLOAD_FOLDER'], user_id)

    print(f"Creating user-specific folder: {user_chunks_folder}")
    print(f"Creating user-specific eps folder: {user_eps_folder}")

    tv_channel = request.form.get('tvChannel')
    episode_number = request.form.get('episodeNumber')
    on_air_date = request.form.get('onAirDate')
    movie_album = request.form.get('movieAlbum')

    if 'file' not in request.files:
        print("No file part found in the request")
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        print("No file selected")
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        if not os.path.exists(user_eps_folder):
            os.makedirs(user_eps_folder)  
        filepath = os.path.join(user_eps_folder, filename)
        file.save(filepath)

        print(f"File saved at: {filepath}")

        try:
            audio = MP3(filepath)
            video_duration_in_seconds = audio.info.length
            video_duration_in_seconds = round(video_duration_in_seconds)
            print(f"File duration: {video_duration_in_seconds} seconds")
        except Exception as e:
            print(f"Error processing MP3 file: {e}")
            return jsonify({"error": "Error processing MP3 file"}), 500

        minutes, seconds = divmod(int(video_duration_in_seconds), 60)
        hours, minutes = divmod(minutes, 60)
        video_duration = f"{str(hours).zfill(2)}:{str(minutes).zfill(2)}:{str(seconds).zfill(2)}"

        if not os.path.exists(user_chunks_folder):
            os.makedirs(user_chunks_folder)
            print(f"Created directory for chunks: {user_chunks_folder}")

        try:
            split_audio_file(filepath, user_chunks_folder)  
            print(f"Audio file split into chunks in: {user_chunks_folder}")
        except Exception as e:
            print(f"Error splitting audio file: {e}")
            return jsonify({"error": "Error splitting audio file"}), 500

        total_chunks = len([f for f in os.listdir(user_chunks_folder) if f.endswith('.mp3')])
        processed_chunks = 0  

        print(f"Total chunks created: {total_chunks}, {video_duration}")

        return jsonify({"fileName": filename, "videoDuration": video_duration, "userId": user_id, "Duration_seconds": video_duration_in_seconds})
    

from test import download_s3_folder


@app.route('/upload_folder', methods=['POST'])
def download_s3_folder_endpoint():
    try:
        data = request.json
        print(f"Request Data: {data}")  

        access_key = data.get('access_key')
        secret_key = data.get('secret_key')
        bucket_name = data.get('bucket_name')
        folder_name = data.get('folder_name')

        if not all([access_key, secret_key, bucket_name, folder_name]):
            return jsonify({"error": "All fields (access_key, secret_key, bucket_name, folder_name) are required."}), 400
        
        local_directory = "ShazamAPI/eps"

        parent_uuids, total_duration_seconds = download_s3_folder(bucket_name, folder_name, local_directory, access_key, secret_key)

        return jsonify({"message": "Files downloaded successfully!", "parent_uuids": parent_uuids, "total_duration_seconds": total_duration_seconds}), 200

    except Exception as e:
        print(f"Error: {e}")  
        return jsonify({"error": str(e)}), 500


@app.route('/detect', methods=['POST'])
def detect_songs():
    global processed_chunks, video_duration

    
    user_id = request.json.get('userId')
    if not user_id:
        return jsonify({"error": "Missing userId in request"}), 400

    user_chunks_folder = os.path.join(app.config['CHUNKS_FOLDER'], user_id)
    user_eps_folder = os.path.join(app.config['UPLOAD_FOLDER'], user_id)

    print(f"Detecting songs in folder: {user_chunks_folder}")

    if not os.path.exists(user_chunks_folder):
        print(f"User-specific folder {user_chunks_folder} not found")
        return jsonify({'error': 'Chunks folder not found for user.'}), 400

    chunk_duration = 10
    detected_songs = []

    chunk_files = sorted([f for f in os.listdir(user_chunks_folder) if f.endswith('.mp3')], key=extract_chunk_number)

    print(f"Chunks to process: {chunk_files}")

    if not chunk_files:
        print(f"No chunk files found in {user_chunks_folder}")
        return jsonify({'error': 'No chunk files found for user.'}), 400

    total_duration = len(chunk_files) * chunk_duration
    for chunk_filename in chunk_files:
        chunk_number = int(chunk_filename.split('chunk')[1].split('.mp3')[0])
        start_time = (chunk_number - 1) * chunk_duration
        end_time = chunk_number * chunk_duration
        chunk_result = f"chunk{str(chunk_number).zfill(2)}: "

        chunk_path = os.path.join(user_chunks_folder, chunk_filename)
        print(f"Processing chunk: {chunk_path}")

        try:
            from test_basic import recognize_song  
            try:
                audd_result = recognize_song(chunk_path, AUDD_API_KEY)
                if audd_result:
                    title, artist, audd_link, label = audd_result
                    detected_songs.append({
                        'title': title,
                        'artist': artist,
                        'label': label,
                        'song_link': audd_link,
                        'start_time': start_time,
                        'end_time': end_time,
                        'detected_with': 'AudD'
                    })
                    print(f"Song detected in {chunk_filename} by AudD: {title} by {artist}")
                    chunk_result += "song detected with AudD"

                else:
                    print(f"No song detected in {chunk_filename} with AudD.")
                    detected_songs.append({
                    'title': "May contain music",
                    'artist': "-",
                    'label': "-",
                    'song_link': "-",
                    'start_time': start_time,
                    'end_time': end_time,
                    'detected_with': 'AudD'
                    })
                    chunk_result += "no song detected - May contain music"
                    
            except Exception as e:
                print(f"Error using AudD for chunk {chunk_filename}: {e}")

        except Exception as e:
            chunk_result += f"error - {str(e)}"
            print(f"Error processing chunk {chunk_filename}: {str(e)}")

        print(chunk_result)
        time.sleep(2)  
        processed_chunks += 1
        print(f"Processed chunks (increment): {processed_chunks}")

    clear_folder(user_chunks_folder)
    os.rmdir(user_chunks_folder)
    clear_folder(user_eps_folder)
    os.rmdir(user_eps_folder)

    print(f"Completed song detection for user: {user_id}")
    return jsonify({'songs': detected_songs, 'videoDuration': total_duration})


from concurrent.futures import ThreadPoolExecutor, as_completed

@app.route('/detectS3', methods=['POST'])
def detect_songs_s3():
    parent_uuids = request.json.get('parentUUIDs')


    if not parent_uuids or not isinstance(parent_uuids, list):
        return jsonify({"error": "Missing or invalid parentUUIDs in request"}), 400

    chunks_folder = os.path.join("ShazamAPI", "chunks")
    eps_folder = os.path.join("ShazamAPI", "eps")
    chunk_duration = 15
    detected_songs_by_uuid = {}

    def extract_metadata_from_file(file_name):
        try:
            base_name = file_name.split('.')[0]
            parts = base_name.split('_')
            return {
                'tv_channel': parts[0] if len(parts) > 0 else None,
                'program_name': parts[1] if len(parts) > 1 else None,
                'ep_number': parts[2] if len(parts) > 2 else None,
                'on_air_date': parts[3].replace(':', '/') if len(parts) > 3 else None,
                'mov_album': parts[4] if len(parts) > 4 else None
            }
        except Exception as e:
            print(f"Error extracting metadata from file name: {file_name}, error: {e}")
            return {
                'tv_channel': None,
                'program_name': None,
                'ep_number': None,
                'on_air_date': None,
                'mov_album': None
            }

    def get_video_file_and_metadata(eps_folder_path, uuid_folder):
        try:
            uuid_path = os.path.join(eps_folder_path, uuid_folder)
            if os.path.isdir(uuid_path):
                video_files = [
                    f for f in os.listdir(uuid_path) if os.path.isfile(os.path.join(uuid_path, f))
                ]
                if video_files:
                    video_file = video_files[0]
                    metadata = extract_metadata_from_file(video_file)
                    return video_file, metadata
            return None, {}
        except Exception as e:
            print(f"Error finding video file in {eps_folder_path}: {e}")
            return None, {}

    def process_uuid_folder(uuid_folder_path, current_uuid, video_file_name, metadata, uuid_folder_results):
        chunk_files = sorted(
            [f for f in os.listdir(uuid_folder_path) if f.endswith('.mp3')],
            key=extract_chunk_number
        )
        if not chunk_files:
            print(f"No chunk files found in {uuid_folder_path}")
            return

        for chunk_filename in chunk_files:
            chunk_number = int(chunk_filename.split('chunk')[1].split('.mp3')[0])
            start_time = (chunk_number - 1) * chunk_duration
            end_time = chunk_number * chunk_duration

            chunk_path = os.path.join(uuid_folder_path, chunk_filename)
            from test_basic import recognize_song
            try:
                audd_result = recognize_song(chunk_path, AUDD_API_KEY)
                if isinstance(audd_result, tuple) and len(audd_result) == 4:
                    title, artist, audd_link, label = audd_result
                    uuid_folder_results.append({
                        'title': title,
                        'artist': artist,
                        'label': label,
                        'song_link': audd_link,
                        'start_time': start_time,
                        'end_time': end_time,
                        'detected_with': 'AudD',
                        'tv_channel': metadata.get('tv_channel', "-"),
                        'program_name': metadata.get('program_name', "-"),
                        'ep_number': metadata.get('ep_number', "-"),
                        'on_air_date': metadata.get('on_air_date', "-"),
                        'mov_album': metadata.get('mov_album', "-"),
                        'video_file_name': video_file_name
                    })
                else:
                    uuid_folder_results.append({
                        'title': "May contain music",
                        'artist': "-",
                        'label': "-",
                        'song_link': "-",
                        'start_time': start_time,
                        'end_time': end_time,
                        'detected_with': 'AudD',
                        'tv_channel': metadata.get('tv_channel', "-"),
                        'program_name': metadata.get('program_name', "-"),
                        'ep_number': metadata.get('ep_number', "-"),
                        'on_air_date': metadata.get('on_air_date', "-"),
                        'mov_album': metadata.get('mov_album', "-"),
                        'video_file_name': video_file_name
                    })
            except Exception as e:
                print(f"Error using AudD for chunk {chunk_filename}: {e}")

    def process_parent_uuid(parent_uuid):
        detected_songs = []
        parent_folder_path = os.path.join(chunks_folder, parent_uuid)
        user_eps_folder = os.path.join(eps_folder, parent_uuid)

        if not os.path.exists(parent_folder_path):
            print(f"Parent UUID folder {parent_folder_path} not found")
            return detected_songs

        for uuid_folder in os.listdir(parent_folder_path):
            uuid_folder_path = os.path.join(parent_folder_path, uuid_folder)
            if os.path.isdir(uuid_folder_path):
                uuid_folder_results = []
                video_file_name, metadata = get_video_file_and_metadata(user_eps_folder, uuid_folder)
                process_uuid_folder(uuid_folder_path, parent_uuid, video_file_name, metadata, uuid_folder_results)
                detected_songs.append(uuid_folder_results)

        if os.path.exists(parent_folder_path):
            clear_folder(parent_folder_path)
            os.rmdir(parent_folder_path)

        if os.path.exists(user_eps_folder):
            clear_folder(user_eps_folder)
            os.rmdir(user_eps_folder)

        return {parent_uuid: detected_songs}

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(process_parent_uuid, uuid): uuid for uuid in parent_uuids}
        for future in as_completed(futures):
            uuid = futures[future]
            try:
                result = future.result()
                detected_songs_by_uuid.update(result)
            except Exception as e:
                print(f"Error processing UUID {uuid}: {e}")

    detected_songs = [results for results in detected_songs_by_uuid.values()]
    return jsonify({'songs': detected_songs})


def list_s3_objects(access_key, secret_key, bucket_name, prefix=''):
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix,
            Delimiter='/' 
        )

        folders = response.get('CommonPrefixes', [])
        files = response.get('Contents', [])

        folder_list = [folder['Prefix'] for folder in folders]
        file_list = [file['Key'] for file in files if file['Key'] != prefix]

        return {
            'folders': folder_list,
            'files': file_list
        }

    except ClientError as e:
        print(f"Error accessing S3: {e}")
        return {'error': str(e)}

@app.route('/api/s3/fetch-s3', methods=['GET'])
def fetch_s3_data():
    access_key = request.args.get('accessKey')
    secret_key = request.args.get('secretKey')
    bucket_name = request.args.get('bucketName')
    prefix = request.args.get('prefix', '')

    if not access_key or not secret_key or not bucket_name:
        return jsonify({'error': 'Missing required parameters'}), 400
    data = list_s3_objects(access_key, secret_key, bucket_name, prefix)

    if 'error' in data:
        return jsonify({'error': data['error']}), 500

    return jsonify(data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
