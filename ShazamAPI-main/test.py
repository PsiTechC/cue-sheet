import boto3
import os
import uuid
from split_audio import split_audio_file
from mutagen.mp3 import MP3
def download_s3_folder(bucket_name, folder_name, local_directory, access_key, secret_key):
    s3 = boto3.client(
        's3',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key
    )

    # List to store all parent UUIDs
    parent_uuids = []
    total_duration_seconds = 0

    # Generate a parent UUID for all files in this operation
    parent_uuid = str(uuid.uuid4())
    parent_uuids.append(parent_uuid)
    parent_folder = os.path.join(local_directory, parent_uuid)
    os.makedirs(parent_folder, exist_ok=True)

    response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_name)
    if 'Contents' not in response:
        print(f"No files found in the S3 folder: {folder_name}")
        return parent_uuids, total_duration_seconds  # Return the UUID list even if no files are found

    for obj in response['Contents']:
        file_key = obj['Key']
        file_name = file_key.split('/')[-1]
        if file_name:  # Ignore folder keys
            # Each file gets its own UUID folder inside the parent folder
            file_uuid = str(uuid.uuid4())
            unique_folder = os.path.join(parent_folder, file_uuid)
            os.makedirs(unique_folder, exist_ok=True)

            # Define the local path for the file
            local_path = os.path.join(unique_folder, file_name)

            print(f"Downloading {file_key} to {local_path}...")
            s3.download_file(bucket_name, file_key, local_path)

            # Process the downloaded file using split_audio_file
            print(f"Processing file {local_path}...")
            chunks_folder = os.path.join("ShazamAPI", "chunks", parent_uuid, file_uuid)
            os.makedirs(chunks_folder, exist_ok=True)
            split_audio_file(local_path, chunks_folder)
            print(f"Chunks saved to {chunks_folder}")

            try:
                audio = MP3(local_path)
                file_duration_seconds = audio.info.length
                total_duration_seconds += file_duration_seconds
                total_duration_seconds = round(total_duration_seconds)
                print(f"File {file_name} duration: {file_duration_seconds} seconds")
            except Exception as e:
                print(f"Error calculating duration for {file_name}: {e}")

    print(f"All files downloaded and processed successfully under parent folder: {parent_folder}")
    return parent_uuids, total_duration_seconds  # Return the UUID list
