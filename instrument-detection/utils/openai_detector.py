"""
OpenAI Vision API integration for instrument detection
Uses GPT-4o/GPT-4o-mini with structured outputs for bounding box detection
"""

import base64
import cv2
import numpy as np
from typing import List, Dict, Optional
from openai import OpenAI
import json
from concurrent.futures import ThreadPoolExecutor, as_completed


class OpenAIInstrumentDetector:
    """Detects musical instruments using OpenAI vision models"""

    # Comprehensive list of musical instruments organized by category
    INSTRUMENTS = {
        "strings": [
            "guitar", "electric guitar", "acoustic guitar", "bass guitar", "classical guitar",
            "violin", "viola", "cello", "double bass", "contrabass",
            "harp", "banjo", "mandolin", "ukulele", "sitar", "lute",
            "zither", "dulcimer", "bouzouki", "balalaika"
        ],
        "keyboards": [
            "piano", "grand piano", "upright piano", "digital piano",
            "keyboard", "synthesizer", "electric keyboard", "MIDI keyboard",
            "organ", "pipe organ", "Hammond organ", "accordion", "harpsichord",
            "mellotron", "keytar"
        ],
        "percussion": [
            "drums", "drum kit", "drum set", "snare drum", "bass drum",
            "tom-tom", "cymbal", "hi-hat", "crash cymbal", "ride cymbal",
            "timpani", "bongo", "conga", "djembe", "tabla",
            "xylophone", "marimba", "vibraphone", "glockenspiel",
            "tambourine", "triangle", "cowbell", "wood block",
            "cajón", "hand drum", "frame drum"
        ],
        "brass": [
            "trumpet", "cornet", "flugelhorn",
            "trombone", "french horn", "tuba", "euphonium",
            "sousaphone", "baritone horn"
        ],
        "woodwinds": [
            "saxophone", "alto saxophone", "tenor saxophone", "soprano saxophone", "baritone saxophone",
            "clarinet", "bass clarinet",
            "flute", "piccolo", "recorder",
            "oboe", "bassoon", "contrabassoon",
            "harmonica", "pan flute", "shakuhachi"
        ],
        "electronic": [
            "synthesizer", "drum machine", "sampler", "sequencer",
            "DJ turntable", "DJ mixer", "DJ controller",
            "MIDI controller", "electronic pad", "launchpad",
            "theremin", "vocoder", "loop station"
        ],
        "audio_equipment": [
            "microphone", "vocal microphone", "studio microphone",
            "headphones", "studio monitors", "speakers",
            "amplifier", "guitar amplifier", "bass amplifier",
            "audio interface", "mixing console", "effects pedal"
        ],
        "world_instruments": [
            "didgeridoo", "bagpipes", "steel drum", "pan drum",
            "erhu", "shamisen", "koto", "guzheng",
            "oud", "duduk", "zurna", "komuz"
        ]
    }

    @classmethod
    def get_all_instruments_flat(cls) -> List[str]:
        """Get flat list of all instruments"""
        all_instruments = []
        for category in cls.INSTRUMENTS.values():
            all_instruments.extend(category)
        return all_instruments

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        use_realtime: bool = False,
        image_detail: str = "low",
        max_workers: int = 5
    ):
        """
        Initialize detector

        Args:
            api_key: OpenAI API key
            model: Model to use (gpt-4o or gpt-4o-mini)
            use_realtime: Whether to use Realtime API (experimental) - deprecated, use parallel processing
            image_detail: Image detail level ('low' for speed, 'high' for accuracy)
            max_workers: Number of parallel workers for batch processing
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.use_realtime = use_realtime
        self.image_detail = image_detail
        self.max_workers = max_workers

        # Define the JSON schema for structured outputs
        # Note: In strict mode, all properties must be in required array
        # Using RELATIVE coordinates (0-1) for better stability across resolutions
        self.detection_schema = {
            "type": "object",
            "properties": {
                "detections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "instrument": {
                                "type": "string",
                                "description": "Type of musical instrument detected"
                            },
                            "bbox": {
                                "type": "array",
                                "items": {
                                    "type": "number",
                                    "minimum": 0.0,
                                    "maximum": 1.0
                                },
                                "minItems": 4,
                                "maxItems": 4,
                                "description": "Bounding box [x_min, y_min, x_max, y_max] in RELATIVE coordinates (0.0 to 1.0)"
                            },
                            "confidence": {
                                "type": "number",
                                "minimum": 0,
                                "maximum": 1,
                                "description": "Confidence score for detection"
                            },
                            "is_being_played": {
                                "type": "boolean",
                                "description": "Whether the instrument appears to be actively played"
                            },
                            "notes": {
                                "type": "string",
                                "description": "Additional observations about the instrument"
                            }
                        },
                        "required": ["instrument", "bbox", "confidence", "is_being_played", "notes"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["detections"],
            "additionalProperties": False
        }

    def encode_frame(self, frame: np.ndarray) -> str:
        """
        Encode frame to base64 JPEG

        Args:
            frame: OpenCV frame (BGR)

        Returns:
            Base64 encoded string
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Encode as JPEG
        _, buffer = cv2.imencode('.jpg', frame_rgb, [cv2.IMWRITE_JPEG_QUALITY, 85])

        # Convert to base64
        base64_str = base64.b64encode(buffer).decode('utf-8')

        return base64_str

    def create_detection_prompt(self, detect_playing: bool = True) -> str:
        """
        Create optimized prompt for instrument detection with improved bounding box accuracy

        Args:
            detect_playing: Whether to ask about playing status

        Returns:
            Prompt string
        """
        playing_instruction = """
- PLAYING STATUS: Set "is_being_played" to true ONLY if you see hands/fingers/mouth actively touching/interacting with the instrument
""" if detect_playing else ""

        prompt = f"""Detect ALL musical instruments visible in this image.

IMPORTANT: Look for REAL physical instruments that someone is holding, playing, or that are visible in the scene.

🚨 CRITICAL BOUNDING BOX RULES - READ CAREFULLY:
1. Draw box around the COMPLETE instrument ONLY - NEVER include any part of a person
2. For held instruments: Draw box TIGHTLY around ONLY the physical instrument structure
3. Even if partially visible, detect it if you can identify what instrument it is
4. COMPLETELY EXCLUDE: All human faces, heads, necks, chins, hands, fingers, arms, torsos, legs, clothing
5. Use RELATIVE coordinates [x_min, y_min, x_max, y_max] between 0.0-1.0

⚠️ IMAGINE CROPPING: Before submitting each bounding box, imagine what the cropped result would look like:
- Would it show ONLY the instrument? ✓ GOOD
- Would it show any human face, body parts, or clothing? ✗ BAD - Make box smaller!

INSTRUMENTS TO DETECT:
• STRINGS: guitar, acoustic guitar, electric guitar, bass, violin, viola, cello, banjo, ukulele, mandolin
• KEYBOARDS: piano, keyboard, synthesizer, organ, accordion
• PERCUSSION: drums, snare drum, bass drum, cymbals, hi-hat, tambourine, bongo, conga, xylophone, marimba
• BRASS: trumpet, trombone, french horn, tuba
• WOODWINDS: saxophone, clarinet, flute, oboe, bassoon, harmonica
• ELECTRONIC: synthesizer, drum machine, DJ equipment
• AUDIO: microphone, amplifier, speaker

GUIDELINES:
- If you see an instrument being held/played, detect it (even if hands are nearby)
- Draw ULTRA-TIGHT boxes around ONLY the instrument object itself
- COMPLETELY EXCLUDE all human body parts: NO faces, heads, torsos, arms, hands, fingers, legs
- The bounding box should fit as closely as possible to the instrument's edges
- Capture ONLY the physical instrument structure - nothing else
- If ≥40% of instrument is visible, detect it
{playing_instruction}
- CONFIDENCE: High confidence if clearly identifiable, lower if partially occluded

BOUNDING BOX PRECISION - INSTRUMENT ONLY:
- Top edge: Start exactly where the instrument top starts (violin scroll top, guitar headstock top)
- Bottom edge: End exactly where the instrument ends (violin body bottom, guitar body bottom)
- Left edge: Tightest left boundary of the instrument (exclude person's body/arms)
- Right edge: Tightest right boundary of the instrument (exclude person's body/arms)
- EXCLUDE COMPLETELY: Human faces, heads, bodies, arms, hands, fingers, clothing, backgrounds, stands, cases, cables
- INCLUDE ONLY: The physical instrument structure itself

CRITICAL EXAMPLES - VIOLIN SPECIFIC:
- ❌ WRONG: Violin held under chin → Box includes face, chin, neck, hands = REJECTED
- ✓ CORRECT: Violin held under chin → Box ONLY around violin body + neck + scroll, starting from scroll tip to body bottom, excluding ALL human parts
- Visual test: If you crop this box, would you see a person's face? If YES, make box smaller!
- The violin should fill >80% of the cropped area - if person fills more space, box is wrong!

OTHER EXAMPLES:
- Guitar with hands on frets → Box around full guitar structure ONLY, NO hands, NO fingers, NO arms, NO torso
- Person singing into microphone → Box around microphone capsule/body ONLY, NO mouth, NO face, NO hands
- Drummer hitting drum → Box around drum ONLY, NO arms, NO sticks in hands, NO drummer's body

AVOID:
- Pure text/titles (unless the actual instrument is also visible)
- Cartoon drawings (unless this is an educational/animated context showing instruments)
- Loose bounding boxes with excessive background
- Bounding boxes that include ANY human body parts whatsoever

Return valid JSON with all instruments found."""

        return prompt

    def detect_instruments(
        self,
        frame: np.ndarray,
        detect_playing: bool = True,
        confidence_threshold: float = 0.5
    ) -> List[Dict]:
        """
        Detect instruments in a single frame

        Args:
            frame: OpenCV frame (BGR)
            detect_playing: Whether to detect if instrument is being played
            confidence_threshold: Minimum confidence to include detection

        Returns:
            List of detections with structure:
            {
                'instrument': str,
                'bbox': [x, y, w, h],
                'confidence': float,
                'is_being_played': bool (optional),
                'notes': str (optional)
            }
        """
        # Encode frame
        base64_image = self.encode_frame(frame)

        # Create prompt
        prompt = self.create_detection_prompt(detect_playing)

        try:
            # Call OpenAI API with vision
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert musical instrument detection system. Your PRIMARY GOAL: Create bounding boxes that when cropped will show ONLY the musical instrument, with ZERO human body parts visible.

🎯 YOUR TASK:
1. Detect ALL musical instruments visible in images (even if partially visible)
2. Create ULTRA-TIGHT bounding boxes around ONLY the instrument object itself
3. COMPLETELY EXCLUDE: All human faces, heads, necks, chins, bodies, hands, fingers, arms, legs, clothing, and backgrounds
4. For held/played instruments: Box must contain ONLY the physical instrument structure, NOT the person holding it
5. VALIDATION TEST: Imagine cropping each box - would the result show a person's face or body? If YES, the box is WRONG!

🚨 CRITICAL RULES - ZERO TOLERANCE FOR HUMAN PARTS:
- Violin held under chin → Box around ONLY violin (scroll to body bottom), absolutely NO face, NO chin, NO neck, NO hands
- Guitar being played → Box around ONLY guitar structure, absolutely NO hands, NO fingers, NO arms, NO torso
- Drums being hit → Box around ONLY the drum itself, absolutely NO drummer's body, NO arms, NO hands
- Microphone being sung into → Box around ONLY mic capsule/body, absolutely NO mouth, NO face, NO singer
- Piano being played → Box around ONLY piano keys/body visible, absolutely NO pianist's body/hands

📏 BOX QUALITY REQUIREMENTS:
- Instrument must fill >80% of the box area (if person fills >20%, box is WRONG)
- Box edges follow instrument contours tightly
- Zero empty space, zero background, zero human parts
- The tighter the box around the instrument, the better

✅ VALIDATION CHECKLIST (Apply to EVERY detection):
1. Does this box contain any human face, head, neck, or chin? → If YES: SHRINK BOX or REJECT
2. Does this box contain any hands, fingers, arms, legs, or torso? → If YES: SHRINK BOX or REJECT
3. Will cropping this box show ONLY the instrument? → If NO: ADJUST BOUNDARIES
4. Does the instrument fill >80% of the box area? → If NO: TIGHTEN THE BOX
5. Visual test: Imagine cropping - would you see a person? → If YES: BOX IS WRONG

🎯 SUCCESS CRITERIA: When your bounding box is cropped, the result should look like a product photo of the instrument - ONLY the instrument, no people!"""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                    "detail": self.image_detail
                                }
                            }
                        ]
                    }
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "instrument_detection",
                        "strict": True,
                        "schema": self.detection_schema
                    }
                },
                temperature=0.1,  # Lower temperature for more consistent, accurate detections
                max_tokens=2000  # Reduced for faster responses
            )

            # Parse response
            content = response.choices[0].message.content
            result = json.loads(content)

            # Filter by confidence
            detections = [
                det for det in result.get('detections', [])
                if det.get('confidence', 0) >= confidence_threshold
            ]

            # Convert relative coordinates to pixel [x, y, width, height] format
            h, w = frame.shape[:2]
            validated_detections = []

            for det in detections:
                bbox_rel = det['bbox']

                # bbox_rel is [x_min, y_min, x_max, y_max] in relative coords (0-1)
                x_min_rel, y_min_rel, x_max_rel, y_max_rel = bbox_rel

                # Clamp to valid range [0, 1]
                x_min_rel = max(0.0, min(1.0, x_min_rel))
                y_min_rel = max(0.0, min(1.0, y_min_rel))
                x_max_rel = max(0.0, min(1.0, x_max_rel))
                y_max_rel = max(0.0, min(1.0, y_max_rel))

                # Validate bounding box size
                bbox_width_rel = x_max_rel - x_min_rel
                bbox_height_rel = y_max_rel - y_min_rel

                # Skip if box is too small (likely text or fragments)
                # Relaxed: Minimum 2% of frame width OR height (was 3% AND)
                if bbox_width_rel < 0.02 and bbox_height_rel < 0.02:
                    print(f"Skipping detection (too small): {det['instrument']} - {bbox_width_rel:.3f}x{bbox_height_rel:.3f}")
                    continue

                # Skip if box is unreasonably large (likely includes person)
                # Maximum 98% of frame for single instrument
                if bbox_width_rel > 0.98 and bbox_height_rel > 0.98:
                    print(f"Skipping detection (too large): {det['instrument']} - {bbox_width_rel:.3f}x{bbox_height_rel:.3f}")
                    continue

                # Convert to pixels
                x_min_px = int(x_min_rel * w)
                y_min_px = int(y_min_rel * h)
                x_max_px = int(x_max_rel * w)
                y_max_px = int(y_max_rel * h)

                # Calculate width and height
                box_w = max(1, x_max_px - x_min_px)
                box_h = max(1, y_max_px - y_min_px)

                # Additional pixel-based validation
                # Relaxed: Skip very small detections (< 30x30 pixels) - was 50x50
                if box_w < 30 or box_h < 30:
                    print(f"Skipping detection (too small in pixels): {det['instrument']} - {box_w}x{box_h}px")
                    continue

                # Store in [x, y, width, height] format (pixel coordinates)
                det['bbox'] = [x_min_px, y_min_px, box_w, box_h]

                # Also store relative coordinates for reference
                det['bbox_relative'] = [x_min_rel, y_min_rel, x_max_rel, y_max_rel]

                # CRITICAL: Validate that this crop doesn't contain too much skin (faces/people)
                # Import skin detection function
                from .bbox_utils import detect_skin_pixels

                try:
                    skin_percentage = detect_skin_pixels(frame, det['bbox'])

                    # Reject detections with >25% skin pixels (likely contains face/person)
                    if skin_percentage > 0.25:
                        print(f"⚠️ Skipping detection (too much skin - {skin_percentage*100:.1f}%): {det['instrument']} - likely includes face/person")
                        print(f"   Bbox: {det['bbox']}, Confidence: {det['confidence']:.2f}")
                        continue
                    elif skin_percentage > 0.15:
                        # Warning but allow through with reduced confidence
                        print(f"⚠️ Warning: Detection has {skin_percentage*100:.1f}% skin pixels: {det['instrument']}")
                        det['confidence'] *= 0.7  # Penalize confidence
                except Exception as e:
                    print(f"Skin detection failed for {det['instrument']}: {e}")
                    # Continue without filtering if skin detection fails

                validated_detections.append(det)

            return validated_detections

        except Exception as e:
            print(f"Error detecting instruments: {e}")
            # Return empty list on error
            return []

    def is_similar_frame(self, frame1: np.ndarray, frame2: np.ndarray, threshold: float = 0.95) -> bool:
        """
        Check if two frames are similar using histogram comparison

        Args:
            frame1: First frame
            frame2: Second frame
            threshold: Similarity threshold (0-1, higher = more similar required)

        Returns:
            True if frames are similar
        """
        # Resize for faster comparison
        small1 = cv2.resize(frame1, (64, 64))
        small2 = cv2.resize(frame2, (64, 64))

        # Convert to grayscale
        gray1 = cv2.cvtColor(small1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(small2, cv2.COLOR_BGR2GRAY)

        # Calculate histograms
        hist1 = cv2.calcHist([gray1], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([gray2], [0], None, [256], [0, 256])

        # Compare histograms
        correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

        return correlation >= threshold

    def batch_detect(
        self,
        frames: List[np.ndarray],
        detect_playing: bool = True,
        confidence_threshold: float = 0.5,
        skip_similar: bool = True,
        similarity_threshold: float = 0.95
    ) -> List[List[Dict]]:
        """
        Detect instruments in multiple frames with parallel processing

        Args:
            frames: List of OpenCV frames
            detect_playing: Whether to detect playing status
            confidence_threshold: Minimum confidence threshold
            skip_similar: Skip frames that are very similar to previous frame
            similarity_threshold: Threshold for frame similarity (0-1)

        Returns:
            List of detection lists, one per frame
        """
        results = [None] * len(frames)
        frames_to_process = []

        # Determine which frames to process (skip similar frames)
        if skip_similar and len(frames) > 1:
            frames_to_process.append((0, frames[0]))  # Always process first frame

            for idx in range(1, len(frames)):
                if not self.is_similar_frame(frames[idx-1], frames[idx], similarity_threshold):
                    frames_to_process.append((idx, frames[idx]))
                else:
                    # Mark to copy from previous frame
                    results[idx] = "COPY_PREVIOUS"
        else:
            frames_to_process = list(enumerate(frames))

        # Process frames in parallel
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_idx = {
                executor.submit(
                    self.detect_instruments,
                    frame,
                    detect_playing,
                    confidence_threshold
                ): idx
                for idx, frame in frames_to_process
            }

            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    detections = future.result()
                    results[idx] = detections
                except Exception as e:
                    print(f"Error processing frame {idx}: {e}")
                    results[idx] = []

        # Fill in copied results
        for idx in range(len(results)):
            if results[idx] == "COPY_PREVIOUS" and idx > 0:
                results[idx] = results[idx - 1].copy() if results[idx - 1] else []

        return results

    def batch_detect_with_metadata(
        self,
        frames_data: List[Dict],
        detect_playing: bool = True,
        confidence_threshold: float = 0.5,
        skip_similar: bool = True,
        progress_callback=None
    ) -> List[Dict]:
        """
        Detect instruments with frame metadata and progress tracking

        Args:
            frames_data: List of dicts with 'frame', 'frame_idx', 'timestamp'
            detect_playing: Whether to detect playing status
            confidence_threshold: Minimum confidence threshold
            skip_similar: Skip similar consecutive frames
            progress_callback: Callback function(current, total) for progress

        Returns:
            List of detections with metadata
        """
        frames = [fd['frame'] for fd in frames_data]
        batch_results = self.batch_detect(
            frames,
            detect_playing=detect_playing,
            confidence_threshold=confidence_threshold,
            skip_similar=skip_similar
        )

        all_detections = []
        for idx, (frame_data, detections) in enumerate(zip(frames_data, batch_results)):
            # Add frame metadata to each detection
            for det in detections:
                det['frame_idx'] = frame_data['frame_idx']
                det['timestamp'] = frame_data['timestamp']

            all_detections.extend(detections)

            if progress_callback:
                progress_callback(idx + 1, len(frames_data))

        return all_detections
