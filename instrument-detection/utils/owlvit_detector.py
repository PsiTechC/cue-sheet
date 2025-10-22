"""
OWL-ViT Instrument Detector
Uses Google's OWL-ViT model for zero-shot object detection of musical instruments
Then uses OpenAI for classification and metadata
"""

import cv2
import numpy as np
from typing import List, Dict, Optional
import torch
from PIL import Image
from transformers import OwlViTProcessor, OwlViTForObjectDetection
from openai import OpenAI
import base64
import json
from torchvision.ops import nms
import hashlib
import copy


class OwlViTInstrumentDetector:
    """
    Two-stage detection using OWL-ViT + OpenAI:
    1. OWL-ViT detects objects with text prompts (precise bounding boxes)
    2. OpenAI classifies each crop and provides metadata
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        image_detail: str = "low",
        owlvit_threshold: float = 0.1
    ):
        """
        Initialize OWL-ViT + OpenAI detector

        Args:
            api_key: OpenAI API key for classification
            model: OpenAI model for classification
            image_detail: Image detail level for OpenAI
            owlvit_threshold: Confidence threshold for OWL-ViT detections
        """
        self.client = OpenAI(api_key=api_key)
        self.model = model
        self.image_detail = image_detail
        self.owlvit_threshold = owlvit_threshold

        # Initialize OWL-ViT model
        print("Loading OWL-ViT model...")
        self.processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")
        self.owlvit_model = OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32")

        # Move to GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.owlvit_model.to(self.device)
        print(f"✓ OWL-ViT model loaded on {self.device}")

        # Text queries for musical instruments
        self.instrument_queries = [
            "a musical instrument",
            "a violin",
            "a guitar",
            "a piano",
            "a drum",
            "a trumpet",
            "a saxophone",
            "a flute",
            "a cello",
            "a clarinet"
        ]

        # Cache for OpenAI classifications to avoid redundant API calls
        self.classification_cache = {}
        self.api_calls_saved = 0

    def compute_crop_hash(self, crop: np.ndarray) -> str:
        """
        Compute a hash of the crop for caching purposes

        Args:
            crop: Cropped image

        Returns:
            Hash string
        """
        # Resize to small size for faster hashing
        small_crop = cv2.resize(crop, (64, 64))
        # Convert to bytes and hash
        crop_bytes = small_crop.tobytes()
        crop_hash = hashlib.md5(crop_bytes).hexdigest()
        return crop_hash

    def apply_nms(self, detections: List[Dict], iou_threshold: float = 0.5) -> List[Dict]:
        """
        Apply Non-Maximum Suppression to remove duplicate detections

        Args:
            detections: List of detections with bbox and score
            iou_threshold: IoU threshold for NMS (default 0.5)

        Returns:
            Filtered list of detections
        """
        if len(detections) == 0:
            return []

        # Convert to tensors
        boxes = []
        scores = []

        for det in detections:
            x, y, w, h = det['bbox']
            # Convert [x, y, w, h] to [x1, y1, x2, y2]
            boxes.append([x, y, x + w, y + h])
            scores.append(det['score'])

        boxes_tensor = torch.tensor(boxes, dtype=torch.float32)
        scores_tensor = torch.tensor(scores, dtype=torch.float32)

        # Apply NMS
        keep_indices = nms(boxes_tensor, scores_tensor, iou_threshold)

        # Filter detections
        filtered_detections = [detections[i] for i in keep_indices.cpu().numpy()]

        return filtered_detections

    def detect_objects_with_owlvit(self, frame: np.ndarray) -> List[Dict]:
        """
        Use OWL-ViT to detect instruments in frame

        Args:
            frame: OpenCV frame (BGR)

        Returns:
            List of detections with bbox, score, label
        """
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image_pil = Image.fromarray(frame_rgb)

        # Prepare inputs
        inputs = self.processor(
            text=self.instrument_queries,
            images=image_pil,
            return_tensors="pt"
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Get predictions
        with torch.no_grad():
            outputs = self.owlvit_model(**inputs)

        # Process results
        target_sizes = torch.Tensor([image_pil.size[::-1]]).to(self.device)
        results = self.processor.post_process_object_detection(
            outputs=outputs,
            threshold=self.owlvit_threshold,
            target_sizes=target_sizes
        )

        detections = []
        boxes, scores, labels = results[0]["boxes"], results[0]["scores"], results[0]["labels"]

        for box, score, label in zip(boxes, scores, labels):
            box = box.cpu().numpy()
            score = score.cpu().item()
            label = label.cpu().item()

            # Convert box to [x, y, w, h]
            x1, y1, x2, y2 = box
            x = int(x1)
            y = int(y1)
            w = int(x2 - x1)
            h = int(y2 - y1)

            detections.append({
                'bbox': [x, y, w, h],
                'score': score,
                'label': self.instrument_queries[label],
                'owlvit_confidence': score
            })

        # Apply NMS to remove duplicate detections of the same object
        detections = self.apply_nms(detections, iou_threshold=0.5)

        return detections

    def classify_crop_with_openai(self, crop: np.ndarray, use_cache: bool = True) -> Optional[Dict]:
        """
        Classify a crop using OpenAI Vision API with caching

        Args:
            crop: Cropped region (BGR)
            use_cache: Whether to use cached results

        Returns:
            Dict with instrument info or None
        """
        # Check cache first to avoid redundant API calls
        if use_cache:
            crop_hash = self.compute_crop_hash(crop)
            if crop_hash in self.classification_cache:
                self.api_calls_saved += 1
                print(f"    💾 Using cached result (saved {self.api_calls_saved} API calls)")
                return self.classification_cache[crop_hash].copy()

        # Encode crop
        _, buffer = cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 85])
        crop_base64 = base64.b64encode(buffer).decode('utf-8')

        prompt = """Identify the musical instrument in this image.

Return JSON:
{
    "is_instrument": true/false,
    "instrument": "violin" or "not_instrument",
    "confidence": 0.0-1.0,
    "is_being_played": true/false,
    "notes": "brief description"
}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at identifying musical instruments. Return JSON only."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{crop_base64}",
                                    "detail": self.image_detail
                                }
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=200
            )

            result = json.loads(response.choices[0].message.content)

            classification_result = None
            if result.get('is_instrument', False) and result.get('instrument') != 'not_instrument':
                classification_result = {
                    'instrument': result.get('instrument', 'unknown'),
                    'confidence': result.get('confidence', 0.5),
                    'is_being_played': result.get('is_being_played', False),
                    'notes': result.get('notes', '')
                }

            # Cache the result (even if None) to avoid re-checking non-instruments
            if use_cache:
                self.classification_cache[crop_hash] = classification_result

            return classification_result

        except Exception as e:
            print(f"OpenAI classification error: {e}")
            return None

    def detect_instruments(
        self,
        frame: np.ndarray,
        detect_playing: bool = True,
        confidence_threshold: float = 0.3
    ) -> List[Dict]:
        """
        Detect instruments using OWL-ViT + OpenAI

        Args:
            frame: Input frame (BGR)
            detect_playing: Whether to detect playing status
            confidence_threshold: Minimum confidence for final detections

        Returns:
            List of detections with instrument metadata
        """
        # Stage 1: OWL-ViT detection
        owlvit_detections = self.detect_objects_with_owlvit(frame)
        print(f"OWL-ViT found {len(owlvit_detections)} potential instruments")

        # Early exit if no instruments detected - skip OpenAI API calls
        if len(owlvit_detections) == 0:
            print("  ⏭ No instruments detected by OWL-ViT, skipping frame")
            return []

        final_detections = []

        # Stage 2: OpenAI classification for each detection
        for idx, det in enumerate(owlvit_detections):
            bbox = det['bbox']
            x, y, w, h = bbox

            # Extract crop
            frame_h, frame_w = frame.shape[:2]
            x = max(0, min(x, frame_w - 1))
            y = max(0, min(y, frame_h - 1))
            w = max(1, min(w, frame_w - x))
            h = max(1, min(h, frame_h - y))

            crop = frame[y:y+h, x:x+w].copy()

            if crop.size == 0:
                continue

            print(f"  Classifying detection {idx+1}/{len(owlvit_detections)} (OWL-ViT: {det['label']})...")

            # Classify with OpenAI
            classification = self.classify_crop_with_openai(crop)

            if classification and classification['confidence'] >= confidence_threshold:
                # Combine OWL-ViT detection with OpenAI classification
                final_det = {
                    'instrument': classification['instrument'],
                    'bbox': bbox,
                    'confidence': classification['confidence'],
                    'is_being_played': classification.get('is_being_played', False),
                    'notes': classification.get('notes', ''),
                    'owlvit_label': det['label'],
                    'owlvit_score': det['owlvit_confidence']
                }
                final_detections.append(final_det)
                print(f"    ✓ {classification['instrument']} (confidence: {classification['confidence']:.2f})")
            else:
                print(f"    ✗ Not a valid instrument")

        return final_detections

    def compute_frame_hash(self, frame: np.ndarray) -> str:
        """
        Compute a perceptual hash of the frame for similarity detection

        Args:
            frame: Input frame

        Returns:
            Hash string representing the frame
        """
        # Resize to small size for faster hashing
        small = cv2.resize(frame, (64, 64))
        # Convert to grayscale
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        # Compute histogram
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        # Normalize and convert to bytes
        hist_normalized = cv2.normalize(hist, None).flatten()
        # Create hash from histogram
        hist_bytes = hist_normalized.tobytes()
        frame_hash = hashlib.md5(hist_bytes).hexdigest()
        return frame_hash

    def compute_object_signature(self, frame: np.ndarray, bbox) -> str:
        """
        Compute a signature for a detected object based on its crop appearance

        Args:
            frame: Full frame
            bbox: Bounding box - either dict with x1,y1,x2,y2 or list [x,y,w,h]

        Returns:
            Hash signature of the object
        """
        # Handle both bbox formats
        if isinstance(bbox, dict):
            x1, y1, x2, y2 = int(bbox['x1']), int(bbox['y1']), int(bbox['x2']), int(bbox['y2'])
        else:  # list format [x, y, w, h]
            x, y, w, h = bbox
            x1, y1, x2, y2 = int(x), int(y), int(x + w), int(y + h)

        crop = frame[y1:y2, x1:x2]

        if crop.size == 0:
            return ""

        # Resize to fixed size for comparison
        crop_resized = cv2.resize(crop, (32, 32))
        gray = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2GRAY)

        # Compute histogram
        hist = cv2.calcHist([gray], [0], None, [64], [0, 256])
        hist_normalized = cv2.normalize(hist, None).flatten()

        # Create hash
        hist_bytes = hist_normalized.tobytes()
        signature = hashlib.md5(hist_bytes).hexdigest()

        return signature

    def is_similar_object(self, frame1: np.ndarray, bbox1, frame2: np.ndarray, bbox2, threshold: float = 0.90) -> bool:
        """
        Check if two detected objects are similar based on appearance

        Args:
            frame1: First frame
            bbox1: Bounding box in first frame - either dict or list [x,y,w,h]
            frame2: Second frame
            bbox2: Bounding box in second frame - either dict or list [x,y,w,h]
            threshold: Similarity threshold

        Returns:
            True if objects are similar
        """
        # Handle both bbox formats
        if isinstance(bbox1, dict):
            x1_1, y1_1, x2_1, y2_1 = int(bbox1['x1']), int(bbox1['y1']), int(bbox1['x2']), int(bbox1['y2'])
        else:  # list format [x, y, w, h]
            x, y, w, h = bbox1
            x1_1, y1_1, x2_1, y2_1 = int(x), int(y), int(x + w), int(y + h)

        if isinstance(bbox2, dict):
            x1_2, y1_2, x2_2, y2_2 = int(bbox2['x1']), int(bbox2['y1']), int(bbox2['x2']), int(bbox2['y2'])
        else:  # list format [x, y, w, h]
            x, y, w, h = bbox2
            x1_2, y1_2, x2_2, y2_2 = int(x), int(y), int(x + w), int(y + h)

        crop1 = frame1[y1_1:y2_1, x1_1:x2_1]
        crop2 = frame2[y1_2:y2_2, x1_2:x2_2]

        if crop1.size == 0 or crop2.size == 0:
            return False

        # Resize to same size
        crop1_resized = cv2.resize(crop1, (64, 64))
        crop2_resized = cv2.resize(crop2, (64, 64))

        # Convert to grayscale
        gray1 = cv2.cvtColor(crop1_resized, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(crop2_resized, cv2.COLOR_BGR2GRAY)

        # Compute histograms
        hist1 = cv2.calcHist([gray1], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([gray2], [0], None, [256], [0, 256])

        # Compare histograms
        correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

        return correlation >= threshold

    def is_similar_frame(self, frame1: np.ndarray, frame2: np.ndarray, threshold: float = 0.95) -> bool:
        """
        Robust frame similarity detection using multiple methods
        Handles edge cases like brightness changes, small movements, etc.

        Args:
            frame1: First frame
            frame2: Second frame
            threshold: Similarity threshold (0-1, higher = more similar required)

        Returns:
            True if frames are similar
        """
        try:
            # Edge case: Check if frames are None or empty
            if frame1 is None or frame2 is None:
                return False

            if frame1.size == 0 or frame2.size == 0:
                return False

            # Edge case: Check if frames have same shape
            if frame1.shape != frame2.shape:
                return False

            # Method 1: Structural Similarity (fast approximation)
            # Resize for faster comparison
            small1 = cv2.resize(frame1, (64, 64))
            small2 = cv2.resize(frame2, (64, 64))

            # Convert to grayscale
            gray1 = cv2.cvtColor(small1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(small2, cv2.COLOR_BGR2GRAY)

            # Method 1a: Mean Absolute Difference (catches major changes)
            mad = np.mean(np.abs(gray1.astype(float) - gray2.astype(float)))
            max_diff = 255.0
            mad_similarity = 1.0 - (mad / max_diff)

            # If frames are very different, return early
            if mad_similarity < 0.85:
                return False

            # Method 2: Histogram Correlation (robust to brightness changes)
            hist1 = cv2.calcHist([gray1], [0], None, [256], [0, 256])
            hist2 = cv2.calcHist([gray2], [0], None, [256], [0, 256])

            # Normalize histograms
            hist1 = cv2.normalize(hist1, hist1).flatten()
            hist2 = cv2.normalize(hist2, hist2).flatten()

            hist_correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

            # Method 3: Color histogram for better robustness
            # Split into color channels and compare
            hsv1 = cv2.cvtColor(small1, cv2.COLOR_BGR2HSV)
            hsv2 = cv2.cvtColor(small2, cv2.COLOR_BGR2HSV)

            # Compare hue channel (robust to brightness/saturation changes)
            hist_h1 = cv2.calcHist([hsv1], [0], None, [180], [0, 180])
            hist_h2 = cv2.calcHist([hsv2], [0], None, [180], [0, 180])

            hist_h1 = cv2.normalize(hist_h1, hist_h1).flatten()
            hist_h2 = cv2.normalize(hist_h2, hist_h2).flatten()

            hue_correlation = cv2.compareHist(hist_h1, hist_h2, cv2.HISTCMP_CORREL)

            # Combined decision: All methods must agree
            # This makes it robust to various edge cases
            combined_score = (hist_correlation * 0.5 + hue_correlation * 0.3 + mad_similarity * 0.2)

            is_similar = combined_score >= threshold

            # Edge case logging for debugging
            if is_similar:
                print(f"    Frame similarity scores: hist={hist_correlation:.3f}, hue={hue_correlation:.3f}, mad={mad_similarity:.3f}, combined={combined_score:.3f}")

            return is_similar

        except Exception as e:
            # Edge case: If comparison fails, assume frames are different
            print(f"    Warning: Frame comparison error: {e}")
            return False

    def find_similar_frame_in_history(self, frame: np.ndarray, processed_frames: Dict, threshold: float = 0.95) -> Optional[str]:
        """
        Check if current frame is similar to any previously processed frame

        Args:
            frame: Current frame
            processed_frames: Dict of {frame_hash: (frame_copy, detections)}
            threshold: Similarity threshold

        Returns:
            Hash of similar frame if found, None otherwise
        """
        # Precompute current frame's histogram for comparison
        small_current = cv2.resize(frame, (64, 64))
        gray_current = cv2.cvtColor(small_current, cv2.COLOR_BGR2GRAY)
        hist_current = cv2.calcHist([gray_current], [0], None, [256], [0, 256])

        # Check similarity against all frames in history
        for frame_hash, (stored_frame, detections) in processed_frames.items():
            # Compute histogram for stored frame
            small_stored = cv2.resize(stored_frame, (64, 64))
            gray_stored = cv2.cvtColor(small_stored, cv2.COLOR_BGR2GRAY)
            hist_stored = cv2.calcHist([gray_stored], [0], None, [256], [0, 256])

            # Compare histograms
            correlation = cv2.compareHist(hist_current, hist_stored, cv2.HISTCMP_CORREL)

            if correlation >= threshold:
                return frame_hash

        return None

    def filter_duplicate_objects(self, frame: np.ndarray, detections: List[Dict],
                                   object_history: Dict, threshold: float = 0.90) -> tuple:
        """
        Filter out objects that are duplicates of previously seen objects

        Args:
            frame: Current frame
            detections: List of detections in current frame
            object_history: Dict of {object_signature: detection}
            threshold: Similarity threshold for object matching

        Returns:
            Tuple of (filtered_detections, duplicate_count)
        """
        filtered_detections = []
        duplicate_count = 0

        for det in detections:
            is_duplicate = False

            # Check against all previously seen objects
            for stored_sig, (stored_frame, stored_det) in object_history.items():
                # Compare object appearance
                if self.is_similar_object(frame, det['bbox'], stored_frame, stored_det['bbox'], threshold):
                    is_duplicate = True
                    duplicate_count += 1
                    print(f"    ⏭ Skipping duplicate object: {det.get('instrument', 'unknown')} (matches previous detection)")
                    break

            if not is_duplicate:
                filtered_detections.append(det)
                # Add to object history
                obj_sig = self.compute_object_signature(frame, det['bbox'])
                if obj_sig:
                    object_history[obj_sig] = (frame.copy(), det)

        return filtered_detections, duplicate_count

    def batch_detect_with_metadata(
        self,
        frames_data: List[Dict],
        detect_playing: bool = True,
        confidence_threshold: float = 0.3,
        skip_similar: bool = True,
        skip_duplicate_objects: bool = True,
        progress_callback=None
    ) -> List[Dict]:
        """
        Robust batch detection with frame metadata
        Handles edge cases: empty frames, corrupted data, None values, etc.

        Args:
            frames_data: List of dicts with 'frame', 'frame_idx', 'timestamp'
            detect_playing: Whether to detect playing status
            confidence_threshold: Minimum confidence threshold
            skip_similar: Skip frames that are very similar to previous frame (only consecutive)
            skip_duplicate_objects: Not used (kept for compatibility)
            progress_callback: Progress callback function

        Returns:
            List of detections with metadata
        """
        all_detections = []
        prev_frame = None
        skipped_count = 0
        no_instrument_count = 0
        error_count = 0

        # Edge case: Check if frames_data is valid
        if not frames_data or len(frames_data) == 0:
            print("⚠️ Warning: No frames provided for processing")
            return []

        for idx, frame_data in enumerate(frames_data):
            try:
                # Edge case: Validate frame_data structure
                if not isinstance(frame_data, dict):
                    print(f"⚠️ Warning: Invalid frame_data at index {idx}, skipping")
                    error_count += 1
                    continue

                if 'frame' not in frame_data:
                    print(f"⚠️ Warning: Missing 'frame' key at index {idx}, skipping")
                    error_count += 1
                    continue

                frame = frame_data['frame']

                # Edge case: Validate frame
                if frame is None or not isinstance(frame, np.ndarray):
                    print(f"⚠️ Warning: Invalid frame at index {idx}, skipping")
                    error_count += 1
                    continue

                if frame.size == 0 or len(frame.shape) != 3:
                    print(f"⚠️ Warning: Empty or malformed frame at index {idx}, skipping")
                    error_count += 1
                    continue

                # Only skip if frame is very similar to immediately previous frame
                should_skip = False
                if skip_similar and prev_frame is not None:
                    try:
                        if self.is_similar_frame(frame, prev_frame, threshold=0.98):
                            should_skip = True
                            skipped_count += 1
                    except Exception as e:
                        print(f"⚠️ Warning: Frame comparison failed at index {idx}: {e}")
                        should_skip = False

                if should_skip:
                    print(f"⏩ Skipping similar frame {idx+1}/{len(frames_data)} (Time: {frame_data.get('timestamp', 0):.2f}s)")
                else:
                    # Process frame
                    print(f"\n{'='*60}")
                    print(f"Processing frame {idx+1}/{len(frames_data)} (Frame idx: {frame_data.get('frame_idx', idx)}, Time: {frame_data.get('timestamp', 0):.2f}s)")
                    print(f"{'='*60}")

                    try:
                        detections = self.detect_instruments(
                            frame,
                            detect_playing=detect_playing,
                            confidence_threshold=confidence_threshold
                        )
                    except Exception as e:
                        print(f"⚠️ Error detecting instruments in frame {idx+1}: {e}")
                        detections = []
                        error_count += 1

                    # Track frames with no instruments
                    if len(detections) == 0:
                        no_instrument_count += 1

                    # Add metadata to each detection
                    for det in detections:
                        det['frame_idx'] = frame_data.get('frame_idx', idx)
                        det['timestamp'] = frame_data.get('timestamp', 0)

                    all_detections.extend(detections)
                    prev_frame = frame.copy()

                if progress_callback:
                    try:
                        progress_callback(idx + 1, len(frames_data))
                    except Exception as e:
                        print(f"⚠️ Warning: Progress callback failed: {e}")

            except Exception as e:
                print(f"⚠️ Error processing frame {idx+1}: {e}")
                error_count += 1
                continue

        print(f"\n{'='*60}")
        print(f"PROCESSING SUMMARY")
        print(f"{'='*60}")
        print(f"✓ Total frames: {len(frames_data)}")
        print(f"✓ Processed: {len(frames_data) - skipped_count - error_count}")
        print(f"✓ Skipped (similar): {skipped_count}")
        print(f"✓ Skipped (no instruments): {no_instrument_count}")
        print(f"✓ Frames with detections: {len(frames_data) - skipped_count - no_instrument_count - error_count}")
        if error_count > 0:
            print(f"⚠️ Errors encountered: {error_count}")
        print(f"💾 Saved {self.api_calls_saved} OpenAI API calls via caching")
        print(f"💰 Cost savings: ~${self.api_calls_saved * 0.01:.2f} (estimated)")
        print(f"{'='*60}\n")
        return all_detections
