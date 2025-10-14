import requests
import os
from dotenv import load_dotenv

load_dotenv()
AUDD_API_KEY = os.getenv("AUDD_API_KEY")

if not AUDD_API_KEY:
    raise ValueError("API Key not found in environment variables!")

def recognize_song(file_path, api_key):
    url = "https://api.audd.io/"
    with open(file_path, 'rb') as audio_file:
        files = {'file': audio_file}
        data = {'api_token': api_key}
        
        response = requests.post(url, data=data, files=files)
        
        if response.status_code == 200:
            result = response.json()
            if 'result' in result and result['result']:
                song_info = result['result']
                title = song_info.get('title', 'Unknown')
                artist = song_info.get('artist', 'Unknown')
                label = song_info.get('label', 'Unknown')
                song_link = song_info.get('song_link', 'N/A')
                print(song_link)
                return title, artist, song_link, label
        return None 

if __name__ == "__main__":
    file_path = "ShazamAPI/songs/chunk08.mp3"
    api_key = AUDD_API_KEY
   

    recognize_song(file_path, api_key)




