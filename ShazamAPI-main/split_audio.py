import os
from pydub import AudioSegment

def split_audio_file(input_file, output_dir, chunk_length_ms=10000):
    audio = AudioSegment.from_mp3(input_file)
    total_chunks = len(audio) // chunk_length_ms
    for i in range(total_chunks + 1):
        start = i * chunk_length_ms
        end = start + chunk_length_ms
        chunk = audio[start:end]
        chunk_name = f"chunk{str(i + 1).zfill(2)}.mp3"
        chunk_path = os.path.join(output_dir, chunk_name)
        chunk.export(chunk_path, format="mp3")
