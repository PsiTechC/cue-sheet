# import os, json
# import numpy as np
# import librosa
# import scipy.ndimage as ndi
# from scipy.signal import find_peaks

# # ----------------------------
# # Config (tweak here)
# # ----------------------------
# FILE_PATH            = "/Users/sanketkapoor/Documents/cue/ShazamAPI-main/ShazamAPI/chunks/ab392f51-ecaf-47ab-9ded-34d5e3c6a99b/24b53324-d79c-4d79-ab3f-862aeda994e4/chunk40.mp3"   # <= set this
# SR                   = 22050                       # resample rate
# HOP_LENGTH           = 512                         # ~23ms hops at 22.05kHz
# N_MFCC               = 20
# CONTEXT_SEC          = 1.0                         # size of L/R context for comparison (in seconds)
# GAUSS_SMOOTH_SEC     = 0.25                        # smooth the score curve (seconds)
# MIN_SEG_SEC          = 2.0                         # don't allow segments shorter than this
# MIN_PEAK_DIST_S      = 2.0                         # min distance between cuts
# MIN_PROMINENCE       = 0.6                         # peak prominence threshold (raise for fewer cuts)
# MAX_CHANGES          = 2                           # at most this many boundaries (=> up to 3 songs)
# SAVE_JSON            = True

# # Pause-cut removal (short lyrical/bgm pauses)
# PAUSE_MAX_SEC        = 2.2                         # treat pauses up to ~2.2s as potential lyrical pauses
# SIM_THRESH           = 0.90                        # MFCC cosine similarity threshold around the pause

# # Lookahead-resume confirmation (search AFTER the cut for a resume of the same pattern)
# LOOKAHEAD_MAX_SEC    = 4.0                         # search up to this many seconds after the cut
# LOOKAHEAD_STEP_SEC   = 0.10                        # slide step for post-cut search window

# # Stricter resume criteria
# SIM_MFCC_RESUME      = 0.95                        # cosine similarity on MFCC means
# SIM_CHROMA_RESUME    = 0.97                        # cosine similarity on chroma means (flattened)
# SIM_DTW_MFCC         = 0.90                        # DTW-derived similarity for MFCC sequences (1/(1+dist_norm))
# CENTROID_HZ_DIFF_MAX = 60.0                        # spectral centroid mean difference allowed to still be "same"

# def tc(sec: float) -> str:
#     sec = max(0.0, float(sec))
#     h = int(sec // 3600); m = int((sec % 3600) // 60); s = int(round(sec % 60))
#     return f"{h:02d}:{m:02d}:{s:02d}"

# def describe_peaks(label: str, peaks_idx: np.ndarray, score: np.ndarray, hop_sec: float):
#     print(f"\nTransitions (coarse) — {label}:")
#     if peaks_idx is None or len(peaks_idx) == 0:
#         print("  none")
#         return
#     for i, p in enumerate(peaks_idx, 1):
#         p = int(p); p = max(0, min(p, len(score)-1))
#         sec = p * hop_sec
#         print(f"  [{i}] {sec:06.2f}s  (score {score[p]:.2f})")

# def cos(u, v) -> float:
#     nu = np.linalg.norm(u); nv = np.linalg.norm(v)
#     if nu == 0 or nv == 0: 
#         return 0.0
#     return float(np.dot(u, v) / (nu * nv))

# def main():
#     y, sr = librosa.load(FILE_PATH, sr=SR, mono=True)
#     dur = len(y) / sr
#     if dur < 0.5:
#         print("File too short.")
#         return

#     # Features
#     hop_sec = HOP_LENGTH / sr
#     mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC, hop_length=HOP_LENGTH)
#     mfcc = (mfcc - mfcc.mean(axis=1, keepdims=True)) / (mfcc.std(axis=1, keepdims=True) + 1e-8)
#     d_mfcc  = librosa.feature.delta(mfcc)
#     chroma  = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=HOP_LENGTH)
#     centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP_LENGTH)[0]  # (n_frames,)
#     rms = librosa.feature.rms(y=y, hop_length=HOP_LENGTH, frame_length=2048, center=True)[0]

#     n_frames = mfcc.shape[1]
#     ctx_frames = max(1, int(round(CONTEXT_SEC / hop_sec)))
#     smooth_frames = max(1, int(round(GAUSS_SMOOTH_SEC / hop_sec)))
#     min_peak_dist_frames = max(1, int(round(MIN_PEAK_DIST_S / hop_sec)))
#     min_seg_frames = max(1, int(round(MIN_SEG_SEC / hop_sec)))

#     # Change score: L2 distance between MFCC means L vs R
#     score = np.zeros(n_frames, dtype=np.float32)
#     for t in range(ctx_frames, n_frames - ctx_frames):
#         L = mfcc[:, t - ctx_frames : t]
#         R = mfcc[:, t : t + ctx_frames]
#         if L.shape[1] == 0 or R.shape[1] == 0:
#             continue
#         muL = L.mean(axis=1); muR = R.mean(axis=1)
#         score[t] = np.linalg.norm(muL - muR, ord=2)

#     # Smooth + normalize
#     if smooth_frames > 1:
#         score = ndi.gaussian_filter1d(score, sigma=smooth_frames/2.0, mode="nearest")
#     if score.max() > 0:
#         score = (score - score.min()) / (score.max() - score.min() + 1e-8)

#     # RAW peaks
#     peaks_raw, _ = find_peaks(score, distance=min_peak_dist_frames, prominence=MIN_PROMINENCE)
#     describe_peaks("RAW (before filters)", peaks_raw, score, hop_sec)

#     # Pause-cut suppression (silence/low energy + left/right MFCC means similar)
#     sil_thresh = np.percentile(rms, 20)
#     pause_w = max(1, int(round((PAUSE_MAX_SEC / 2.0) / hop_sec)))  # half-window in frames

#     def is_pause_cut(idx: int) -> bool:
#         lo = max(0, idx - pause_w); hi = min(len(rms), idx + pause_w + 1)
#         if np.min(rms[lo:hi]) > sil_thresh:
#             return False
#         if idx < ctx_frames or (idx + ctx_frames) >= n_frames:
#             return False
#         L = mfcc[:, idx - ctx_frames : idx]
#         R = mfcc[:, idx : idx + ctx_frames]
#         muL = L.mean(axis=1); muR = R.mean(axis=1)
#         return cos(muL, muR) >= SIM_THRESH

#     peaks_after_pause = np.array([p for p in peaks_raw if not is_pause_cut(int(p))], dtype=int)
#     describe_peaks("after pause-filter", peaks_after_pause, score, hop_sec)

#     # Strong lookahead resume check (multi-metric)
#     look_max_frames  = max(1, int(round(LOOKAHEAD_MAX_SEC / hop_sec)))
#     look_step_frames = max(1, int(round(LOOKAHEAD_STEP_SEC / hop_sec)))

#     def is_resume_after_cut(idx: int) -> bool:
#         if idx < ctx_frames:
#             return False

#         # Pre-cut context summaries + sequences
#         L_mfcc   = mfcc[:, idx - ctx_frames : idx]
#         L_dmfcc  = d_mfcc[:, idx - ctx_frames : idx]
#         L_chroma = chroma[:, idx - ctx_frames : idx]
#         L_cent   = centroid[idx - ctx_frames : idx]
#         if L_mfcc.shape[1] == 0:
#             return False

#         muL_mfcc   = L_mfcc.mean(axis=1)
#         muL_dmfcc  = L_dmfcc.mean(axis=1)
#         # Flatten chroma sequence (normalize across time)
#         L_chroma_flat = L_chroma / (np.linalg.norm(L_chroma, axis=0, keepdims=True) + 1e-8)
#         L_chroma_flat = L_chroma_flat.flatten(order="F")
#         L_chroma_flat /= (np.linalg.norm(L_chroma_flat) + 1e-8)
#         muL_cent   = float(np.mean(L_cent))

#         start_t = idx
#         end_t   = min(n_frames - ctx_frames, idx + look_max_frames)
#         if end_t <= start_t:
#             return False

#         for t in range(start_t, end_t, look_step_frames):
#             # skip too-quiet windows (likely still pause/silence)
#             if np.mean(rms[t : t + ctx_frames]) <= sil_thresh:
#                 continue

#             R_mfcc   = mfcc[:, t : t + ctx_frames]
#             R_dmfcc  = d_mfcc[:, t : t + ctx_frames]
#             R_chroma = chroma[:, t : t + ctx_frames]
#             R_cent   = centroid[t : t + ctx_frames]
#             if R_mfcc.shape[1] == 0:
#                 continue

#             muR_mfcc   = R_mfcc.mean(axis=1)
#             muR_dmfcc  = R_dmfcc.mean(axis=1)

#             # chroma flattened
#             R_chroma_flat = R_chroma / (np.linalg.norm(R_chroma, axis=0, keepdims=True) + 1e-8)
#             R_chroma_flat = R_chroma_flat.flatten(order="F")
#             R_chroma_flat /= (np.linalg.norm(R_chroma_flat) + 1e-8)

#             muR_cent   = float(np.mean(R_cent))

#             # Similarities
#             same_mfcc_mean  = cos(muL_mfcc,  muR_mfcc)  >= SIM_MFCC_RESUME
#             same_dmfcc_mean = cos(muL_dmfcc, muR_dmfcc) >= SIM_MFCC_RESUME
#             same_chroma_seq = cos(L_chroma_flat, R_chroma_flat) >= SIM_CHROMA_RESUME
#             close_centroid  = abs(muL_cent - muR_cent) <= CENTROID_HZ_DIFF_MAX

#             # Quick DTW on MFCC sequences (time×features)
#             try:
#                 D, wp = librosa.sequence.dtw(X=L_mfcc.T, Y=R_mfcc.T, metric="cosine")
#                 path_cost = float(D[wp[:,0], wp[:,1]].mean()) if len(wp) else float(D[-1,-1])
#                 sim_dtw = 1.0 / (1.0 + path_cost)  # in (0,1], higher=more similar
#             except Exception:
#                 sim_dtw = 0.0

#             if (
#                 same_mfcc_mean or
#                 (same_dmfcc_mean and same_chroma_seq) or
#                 (same_mfcc_mean and close_centroid) or
#                 (same_chroma_seq and close_centroid) or
#                 (sim_dtw >= SIM_DTW_MFCC)
#             ):
#                 # print(f"Drop cut ~{idx*hop_sec:.2f}s: resume at ~{t*hop_sec:.2f}s (sim_dtw={sim_dtw:.2f})")
#                 return True

#         return False

#     peaks_after_resume = np.array([p for p in peaks_after_pause if not is_resume_after_cut(int(p))], dtype=int)
#     describe_peaks("after resume-check", peaks_after_resume, score, hop_sec)

#     # Final selection: strongest first, enforce min segment length & cap
#     peaks_final = np.array([], dtype=int)
#     if len(peaks_after_resume) > 0:
#         order = np.argsort(score[peaks_after_resume])[::-1]
#         peaks_sorted = peaks_after_resume[order]
#         chosen = []

#         def ok_with_existing(p):
#             cand = sorted(chosen + [p])
#             bounds = [0] + cand + [n_frames - 1]
#             for i in range(len(bounds)-1):
#                 if (bounds[i+1] - bounds[i]) < min_seg_frames:
#                     return False
#             return True

#         for p in peaks_sorted:
#             if len(chosen) >= MAX_CHANGES:
#                 break
#             if ok_with_existing(int(p)):
#                 chosen.append(int(p))
#         peaks_final = np.array(sorted(chosen), dtype=int)

#     describe_peaks("KEPT (final)", peaks_final, score, hop_sec)
#     print(f"\nPeaks count: raw={len(peaks_raw)}, after_pause={len(peaks_after_pause)}, "
#           f"after_resume={len(peaks_after_resume)}, kept={len(peaks_final)}")

#     # Build segments
#     frame_bounds = [0] + list(peaks_final) + [n_frames - 1]
#     segments = []
#     for i in range(len(frame_bounds)-1):
#         a = frame_bounds[i] * hop_sec
#         b = frame_bounds[i+1] * hop_sec
#         a = max(0.0, a); b = max(b, a)
#         segments.append((a, b))

#     # Merge tiny edge segs & clamp
#     merged = []
#     for (a,b) in segments:
#         a = max(0.0, min(a, dur))
#         b = max(0.0, min(b, dur))
#         if b - a < MIN_SEG_SEC and merged:
#             pa, pb = merged.pop()
#             merged.append((pa, max(pb, b)))
#         else:
#             merged.append((a,b))

#     if merged:
#         if dur - merged[-1][1] <= max(MIN_SEG_SEC, hop_sec*2):
#             merged[-1] = (merged[-1][0], dur)

#     print(f"\nDuration: {dur:.3f}s  |  Frames: {n_frames}  |  Hop: {HOP_LENGTH}  (~{hop_sec:.3f}s)")
#     print("\nSegments:")
#     for i, (a,b) in enumerate(merged, 1):
#         print(f"  [{i}] {tc(a)}  →  {tc(b)}  (len {b-a:.2f}s)")

#     if SAVE_JSON:
#         out = {
#             "file": os.path.abspath(FILE_PATH),
#             "sample_rate": sr,
#             "hop_sec": hop_sec,
#             "cuts": {
#                 "raw":           [round(int(p) * hop_sec, 3) for p in peaks_raw],
#                 "after_pause":   [round(int(p) * hop_sec, 3) for p in peaks_after_pause],
#                 "after_resume":  [round(int(p) * hop_sec, 3) for p in peaks_after_resume],
#                 "final_kept":    [round(int(p) * hop_sec, 3) for p in peaks_final],
#             },
#             "segments": [{"start_sec": float(a), "end_sec": float(b)} for (a,b) in merged],
#         }
#         with open("coarse_transitions.json", "w", encoding="utf-8") as f:
#             json.dump(out, f, indent=2)
#         print("\nWrote coarse_transitions.json")

# if __name__ == "__main__":
#     main()




# detect_partition_point.py
# Same core logic as your current script, but exposes:
#   detect_partition_point(file_path) -> Optional[float]
# Returns the single partition time in seconds, or None if no valid cut.
#
# Dependencies: numpy, librosa, scipy

import os, json
import numpy as np
import librosa
import scipy.ndimage as ndi
from scipy.signal import find_peaks
from typing import Optional

# ----------------------------
# Config (kept the same)
# ----------------------------
SR                   = 22050                       # resample rate
HOP_LENGTH           = 512                         # ~23ms hops at 22.05kHz
N_MFCC               = 20
CONTEXT_SEC          = 1.0                         # size of L/R context for comparison (in seconds)
GAUSS_SMOOTH_SEC     = 0.25                        # smooth the score curve (seconds)
MIN_SEG_SEC          = 2.0                         # don't allow segments shorter than this
MIN_PEAK_DIST_S      = 2.0                         # min distance between cuts
MIN_PROMINENCE       = 0.6                         # peak prominence threshold (raise for fewer cuts)
MAX_CHANGES          = 2                           # (we’ll still compute up to 2; we return the strongest single cut)

# Pause-cut removal (short lyrical/bgm pauses)
PAUSE_MAX_SEC        = 2.2                         # treat pauses up to ~2.2s as potential lyrical pauses
SIM_THRESH           = 0.90                        # MFCC cosine similarity threshold around the pause

# Lookahead-resume confirmation (search AFTER the cut for a resume of the same pattern)
LOOKAHEAD_MAX_SEC    = 4.0                         # search up to this many seconds after the cut
LOOKAHEAD_STEP_SEC   = 0.10                        # slide step for post-cut search window

# Stricter resume criteria
SIM_MFCC_RESUME      = 0.95                        # cosine similarity on MFCC means
SIM_CHROMA_RESUME    = 0.97                        # cosine similarity on chroma means (flattened)
SIM_DTW_MFCC         = 0.90                        # DTW-derived similarity for MFCC sequences (1/(1+dist_norm))
CENTROID_HZ_DIFF_MAX = 60.0                        # spectral centroid mean difference allowed to still be "same"

# ----------------------------
# Helpers
# ----------------------------
def cos(u, v) -> float:
    nu = np.linalg.norm(u); nv = np.linalg.norm(v)
    if nu == 0 or nv == 0:
        return 0.0
    return float(np.dot(u, v) / (nu * nv))

# ----------------------------
# Core function (returns only the partition time in seconds or None)
# ----------------------------
def detect_partition_point(file_path: str) -> Optional[float]:
    """
    Run the same pipeline on a ~10s chunk and return a single cut time in seconds,
    or None if no valid, well-formed partition is found (respecting MIN_SEG_SEC on both sides).
    """
    # Load audio
    y, sr = librosa.load(file_path, sr=SR, mono=True)
    dur = len(y) / sr
    if dur < 0.5:
        return None

    # Features
    hop_sec = HOP_LENGTH / sr
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC, hop_length=HOP_LENGTH)
    # z-score along time to normalize
    mfcc = (mfcc - mfcc.mean(axis=1, keepdims=True)) / (mfcc.std(axis=1, keepdims=True) + 1e-8)

    d_mfcc  = librosa.feature.delta(mfcc)
    chroma  = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=HOP_LENGTH)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP_LENGTH)[0]  # (n_frames,)
    rms = librosa.feature.rms(y=y, hop_length=HOP_LENGTH, frame_length=2048, center=True)[0]

    n_frames = mfcc.shape[1]
    ctx_frames = max(1, int(round(CONTEXT_SEC / hop_sec)))
    smooth_frames = max(1, int(round(GAUSS_SMOOTH_SEC / hop_sec)))
    min_peak_dist_frames = max(1, int(round(MIN_PEAK_DIST_S / hop_sec)))
    min_seg_frames = max(1, int(round(MIN_SEG_SEC / hop_sec)))

    # Change score: L2 distance between MFCC means L vs R
    score = np.zeros(n_frames, dtype=np.float32)
    for t in range(ctx_frames, n_frames - ctx_frames):
        L = mfcc[:, t - ctx_frames : t]
        R = mfcc[:, t : t + ctx_frames]
        if L.shape[1] == 0 or R.shape[1] == 0:
            continue
        muL = L.mean(axis=1); muR = R.mean(axis=1)
        score[t] = np.linalg.norm(muL - muR, ord=2)

    # Smooth + normalize
    if smooth_frames > 1:
        score = ndi.gaussian_filter1d(score, sigma=smooth_frames/2.0, mode="nearest")
    if score.max() > 0:
        score = (score - score.min()) / (score.max() - score.min() + 1e-8)

    # RAW peaks
    peaks_raw, _ = find_peaks(score, distance=min_peak_dist_frames, prominence=MIN_PROMINENCE)

    # Pause-cut suppression (silence/low energy + left/right MFCC means similar)
    sil_thresh = np.percentile(rms, 20)
    pause_w = max(1, int(round((PAUSE_MAX_SEC / 2.0) / hop_sec)))  # half-window in frames

    def is_pause_cut(idx: int) -> bool:
        lo = max(0, idx - pause_w); hi = min(len(rms), idx + pause_w + 1)
        if np.min(rms[lo:hi]) > sil_thresh:
            return False
        if idx < ctx_frames or (idx + ctx_frames) >= n_frames:
            return False
        L = mfcc[:, idx - ctx_frames : idx]
        R = mfcc[:, idx : idx + ctx_frames]
        muL = L.mean(axis=1); muR = R.mean(axis=1)
        return cos(muL, muR) >= SIM_THRESH

    peaks_after_pause = np.array([p for p in peaks_raw if not is_pause_cut(int(p))], dtype=int)

    # Strong lookahead resume check (multi-metric)
    look_max_frames  = max(1, int(round(LOOKAHEAD_MAX_SEC / hop_sec)))
    look_step_frames = max(1, int(round(LOOKAHEAD_STEP_SEC / hop_sec)))

    def is_resume_after_cut(idx: int) -> bool:
        if idx < ctx_frames:
            return False

        # Pre-cut context summaries + sequences
        L_mfcc   = mfcc[:, idx - ctx_frames : idx]
        L_dmfcc  = d_mfcc[:, idx - ctx_frames : idx]
        L_chroma = chroma[:, idx - ctx_frames : idx]
        L_cent   = centroid[idx - ctx_frames : idx]
        if L_mfcc.shape[1] == 0:
            return False

        muL_mfcc   = L_mfcc.mean(axis=1)
        muL_dmfcc  = L_dmfcc.mean(axis=1)
        # Flatten chroma sequence (normalize across time)
        L_chroma_flat = L_chroma / (np.linalg.norm(L_chroma, axis=0, keepdims=True) + 1e-8)
        L_chroma_flat = L_chroma_flat.flatten(order="F")
        L_chroma_flat /= (np.linalg.norm(L_chroma_flat) + 1e-8)
        muL_cent   = float(np.mean(L_cent))

        start_t = idx
        end_t   = min(n_frames - ctx_frames, idx + look_max_frames)
        if end_t <= start_t:
            return False

        for t in range(start_t, end_t, look_step_frames):
            # skip too-quiet windows (likely still pause/silence)
            if np.mean(rms[t : t + ctx_frames]) <= sil_thresh:
                continue

            R_mfcc   = mfcc[:, t : t + ctx_frames]
            R_dmfcc  = d_mfcc[:, t : t + ctx_frames]
            R_chroma = chroma[:, t : t + ctx_frames]
            R_cent   = centroid[t : t + ctx_frames]
            if R_mfcc.shape[1] == 0:
                continue

            muR_mfcc   = R_mfcc.mean(axis=1)
            muR_dmfcc  = R_dmfcc.mean(axis=1)

            # chroma flattened
            R_chroma_flat = R_chroma / (np.linalg.norm(R_chroma, axis=0, keepdims=True) + 1e-8)
            R_chroma_flat = R_chroma_flat.flatten(order="F")
            R_chroma_flat /= (np.linalg.norm(R_chroma_flat) + 1e-8)

            muR_cent   = float(np.mean(R_cent))

            # Similarities
            same_mfcc_mean  = cos(muL_mfcc,  muR_mfcc)  >= SIM_MFCC_RESUME
            same_dmfcc_mean = cos(muL_dmfcc, muR_dmfcc) >= SIM_MFCC_RESUME
            same_chroma_seq = cos(L_chroma_flat, R_chroma_flat) >= SIM_CHROMA_RESUME
            close_centroid  = abs(muL_cent - muR_cent) <= CENTROID_HZ_DIFF_MAX

            # Quick DTW on MFCC sequences (time×features)
            try:
                D, wp = librosa.sequence.dtw(X=L_mfcc.T, Y=R_mfcc.T, metric="cosine")
                path_cost = float(D[wp[:,0], wp[:,1]].mean()) if len(wp) else float(D[-1,-1])
                sim_dtw = 1.0 / (1.0 + path_cost)  # in (0,1], higher=more similar
            except Exception:
                sim_dtw = 0.0

            if (
                same_mfcc_mean or
                (same_dmfcc_mean and same_chroma_seq) or
                (same_mfcc_mean and close_centroid) or
                (same_chroma_seq and close_centroid) or
                (sim_dtw >= SIM_DTW_MFCC)
            ):
                return True

        return False

    peaks_after_resume = np.array([p for p in peaks_after_pause if not is_resume_after_cut(int(p))], dtype=int)

    # Final selection: strongest first, enforce min segment length & cap
    peaks_final = np.array([], dtype=int)
    if len(peaks_after_resume) > 0:
        order = np.argsort(score[peaks_after_resume])[::-1]
        peaks_sorted = peaks_after_resume[order]
        chosen = []

        def ok_with_existing(p):
            cand = sorted(chosen + [p])
            bounds = [0] + cand + [n_frames - 1]
            for i in range(len(bounds)-1):
                if (bounds[i+1] - bounds[i]) < min_seg_frames:
                    return False
            return True

        for p in peaks_sorted:
            if len(chosen) >= MAX_CHANGES:
                break
            if ok_with_existing(int(p)):
                chosen.append(int(p))
        peaks_final = np.array(sorted(chosen), dtype=int)

    # We only need ONE partition point: pick the strongest among the final kept peaks.
    if peaks_final.size == 0:
        return None

    best_idx = int(max(peaks_final, key=lambda p: score[int(p)]))
    cut_sec = round(best_idx * hop_sec, 3)

    # Enforce min segment length around the cut
    if (cut_sec < MIN_SEG_SEC) or ((dur - cut_sec) < MIN_SEG_SEC):
        return None

    return float(cut_sec)

# ---------------------------------
# Optional: tiny CLI for quick test
# ---------------------------------
if __name__ == "__main__":
    # Example: set a path here for quick local testing,
    # or run: python detect_partition_point.py /path/to/chunk.mp3
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "/path/to/your_10s_chunk.mp3"
    res = detect_partition_point(path)
    if res is None:
        print("None")
    else:
        # print only the seconds value as requested
        print(f"{res:.3f}")
