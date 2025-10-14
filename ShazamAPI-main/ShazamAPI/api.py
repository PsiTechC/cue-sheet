import time
import types
import uuid
from io import BytesIO
from typing import BinaryIO, Generator, Tuple, Union

try:
    from typing import Final  # noqa: WPS433
except ImportError:
    from typing_extensions import Final  # noqa: WPS433, WPS440

import requests
from pydub import AudioSegment

from .algorithm import SignatureGenerator
from .signature_format import DecodedMessage

LANG: Final = 'ru'
REGION: Final = 'RU'
TIMEZONE: Final = 'Europe/Moscow'


# LANG: Final = 'hi'  
# REGION: Final = 'IN' 
# TIMEZONE: Final = 'Asia/Kolkata'  

API_URL_TEMPLATE: Final = (
    'https://amp.shazam.com/discovery/v5'
    + '/{lang}/{region}/iphone/-/tag/{uuid_a}/{uuid_b}'
)
# BASE_HEADERS: Final = types.MappingProxyType({
#     'X-Shazam-Platform': 'IPHONE',
#     'X-Shazam-AppVersion': '14.1.0',
#     'Accept': '*/*',
#     'Accept-Encoding': 'gzip, deflate',
#     'User-Agent': 'Shazam/3685 CFNetwork/1197 Darwin/20.0.0',
# })


BASE_HEADERS: Final = types.MappingProxyType({
    'X-Shazam-Platform': 'IPHONE',
    'X-Shazam-AppVersion': '18.3.0',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate',
    'User-Agent': 'Shazam/18.3.0 CFNetwork/1404.0.5 Darwin/22.3.0',
})

# PARAMS: Final = types.MappingProxyType({
#     'sync': 'true',
#     'webv3': 'true',
#     'sampling': 'true',
#     'connected': '',
#     'shazamapiversion': 'v3',
#     'sharehub': 'true',
#     'hubv5minorversion': 'v5.1',
#     'hidelb': 'true',
#     'video': 'v3',
# })


PARAMS: Final = types.MappingProxyType({
    'sync': 'true',
    'webv3': 'true',
    'sampling': 'true',
    'connected': '',
    'shazamapiversion': 'v15',
    'sharehub': 'true',
    'hubv5minorversion': 'v5.1',
    'hidelb': 'true',
    'video': 'v3',
})


NORMALIZED_SAMPLE_WIDTH: Final = 2
NORMALIZED_FRAME_RATE: Final = 16000
NORMALIZED_CHANNELS: Final = 1


class Shazam(object):
    max_time_seconds = 8

    def __init__(
        self,
        lang: str = LANG,
        region: str = REGION,
        timezone: str = TIMEZONE,
    ):
        self.lang = lang
        self.region = region
        self.timezone = timezone

    def recognize_song(
        self, audio: Union[bytes, BinaryIO, AudioSegment],
    ) -> Generator[Tuple[float, dict], None, None]:
        audio = self.normalize_audio_data(audio)
        signature_generator = self.create_signature_generator(audio)
        for signature in signature_generator:
            results = self.send_recognize_request(signature)
            current_offset = int(
                signature_generator.samples_processed // NORMALIZED_FRAME_RATE,
            )

            yield current_offset, results

    def normalize_audio_data(
        self, audio: Union[bytes, BinaryIO, AudioSegment],
    ) -> AudioSegment:
        if isinstance(audio, bytes):
            audio = AudioSegment.from_file(BytesIO(audio))
        elif not isinstance(audio, AudioSegment):
            audio = AudioSegment.from_file(audio)

        audio = audio.set_sample_width(NORMALIZED_SAMPLE_WIDTH)
        audio = audio.set_frame_rate(NORMALIZED_FRAME_RATE)
        audio = audio.set_channels(NORMALIZED_CHANNELS)
        return audio  # noqa: WPS331

    def create_signature_generator(
        self, audio: AudioSegment,
    ) -> SignatureGenerator:
        signature_generator = SignatureGenerator()
        signature_generator.feed_input(audio.get_array_of_samples())
        signature_generator.MAX_TIME_SECONDS = self.max_time_seconds

        if audio.duration_seconds > 12 * 3:
            signature_generator.samples_processed += NORMALIZED_FRAME_RATE * (
                int(audio.duration_seconds / 16) - 6
            )

        return signature_generator

    def send_recognize_request(self, sig: DecodedMessage) -> dict:
        data = {
            'timezone': self.timezone,
            'signature': {
                'uri': sig.encode_to_uri(),
                'samplems': int(
                    sig.number_samples / sig.sample_rate_hz * 1000,
                ),
            },
            'timestamp': int(time.time() * 1000),
            'context': {},
            'geolocation': {},
        }

        while True:  # Use a loop to keep retrying after hitting rate limits
            resp = requests.post(
                API_URL_TEMPLATE.format(
                    lang=self.lang,
                    region=self.region,
                    uuid_a=str(uuid.uuid4()).upper(),
                    uuid_b=str(uuid.uuid4()).upper(),
                ),
                params=PARAMS,
                headers={
                    **BASE_HEADERS,
                    'Accept-Language': self.lang,
                },
                json=data,
            )

            # Check for successful response
            if resp.status_code == 200:
                try:
                    return resp.json()  # Try to parse JSON response
                except requests.exceptions.JSONDecodeError:
                    print("Error: Failed to decode JSON response. Response text:", resp.text)
                    return None

            # Check if rate limit (HTTP 429) is hit
            elif resp.status_code == 429:
                retry_after = resp.headers.get('Retry-After')
                if retry_after:
                    retry_after = int(retry_after)
                    print(f"Rate limit hit. Waiting for {retry_after} seconds before retrying...")
                    time.sleep(retry_after)  # Wait for the time specified in 'Retry-After'
                else:
                    print(f"Rate limit hit. Waiting for 60 seconds before retrying...")
                    time.sleep(60)  # Fixed 1-minute delay if 'Retry-After' is not provided
            else:
                print(f"Error: Received status code {resp.status_code}. Response text: {resp.text}")
                return None


def detect_song(file_path):
    shazam = Shazam()
    recognize_generator = shazam.recognize_song(file_path)
    
    retry_attempts = 0
    max_retries = 3  # Number of retries before giving up

    for (offset, resp) in recognize_generator:
        # If resp is None, retry up to the max_retries
        if resp is None:
            retry_attempts += 1
            if retry_attempts > max_retries:
                print(f"Error: No valid response after {max_retries} retries. Skipping this detection.")
                break
            else:
                print(f"Error: No valid response at offset {offset}. Retrying...")
                continue  # Retry the current detection

        # Check that 'resp' is not None before checking for 'track'
        if isinstance(resp, dict) and 'track' in resp:
            print(f"Track detected at {offset} seconds:")
            track = resp['track']
            print(f"Track: {track['title']} by {track['subtitle']}")
            retry_attempts = 0  # Reset retry attempts on success
        else:
            print(f"No track detected at {offset} seconds.")


# Example usage:
if __name__ == "__main__":
    file_path = "ShazamAPI/songs/chunk17.mp3"
    for i in range(100):
        print(f"Test {i + 1}:")
        detect_song(file_path)
