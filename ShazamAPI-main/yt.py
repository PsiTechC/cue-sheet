# # yt.py
# import os, json, re, subprocess, tempfile, yt_dlp

# class CollectLogger:
#     def __init__(self):
#         self.warnings, self.errors, self.infos = [], [], []
#     def debug(self, msg):   self.infos.append(str(msg))
#     def info(self, msg):    self.infos.append(str(msg))
#     def warning(self, msg): self.warnings.append(str(msg))
#     def error(self, msg):   self.errors.append(str(msg))

# YOUTUBE_RE = re.compile(r'^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+', re.IGNORECASE)

# def is_url(s: str) -> bool:
#     return bool(YOUTUBE_RE.match(s.strip()))

# def parse_links_field(raw: str) -> list[str]:
#     if not raw: return []
#     raw = raw.strip()
#     try:
#         maybe = json.loads(raw)
#         urls = [str(x).strip() for x in maybe] if isinstance(maybe, list) else [raw]
#     except Exception:
#         urls = [p.strip() for p in re.split(r'[\n,\s]+', raw) if p.strip()]
#     return [u for u in urls if is_url(u)]

# def download_youtube_audios(urls: list[str], out_dir: str) -> list[str]:
#     """
#     Download each YouTube URL as MP3 into out_dir using yt-dlp (+ffmpeg),
#     writing **safe filenames** to avoid ffmpeg concat quoting issues.
#     Returns list of absolute MP3 paths.
#     """
#     os.makedirs(out_dir, exist_ok=True)
#     logger = CollectLogger()
#     ydl_opts = {
#         "format": "bestaudio/best",
#         # SAFE: use only the video id; avoid titles/quotes/spaces
#         "outtmpl": os.path.join(out_dir, "%(id)s.%(ext)s"),
#         "restrictfilenames": True,   # ASCII-safe filenames
#         "windowsfilenames": True,    # extra sanitization
#         "overwrites": True,
#         "quiet": True,
#         "noprogress": True,
#         "logger": logger,
#         "postprocessors": [{
#             "key": "FFmpegExtractAudio",
#             "preferredcodec": "mp3",
#             "preferredquality": "192",
#         }],
#     }

#     mp3_paths: list[str] = []
#     with yt_dlp.YoutubeDL(ydl_opts) as ydl:
#         for url in urls:
#             try:
#                 info = ydl.extract_info(url, download=True)
#                 vid = info.get("id")
#                 # we forced the template to <id>.mp3
#                 candidate = os.path.join(out_dir, f"{vid}.mp3") if vid else None
#                 if candidate and os.path.exists(candidate):
#                     mp3_paths.append(candidate)
#                 else:
#                     # last-resort scan
#                     found = None
#                     for name in os.listdir(out_dir):
#                         if vid and vid in name and name.lower().endswith(".mp3"):
#                             found = os.path.join(out_dir, name)
#                             break
#                     if found:
#                         mp3_paths.append(found)
#                     else:
#                         logger.error(f"{url}: mp3 file not found after postprocessing")
#             except Exception as e:
#                 logger.error(f"{url}: {e}")

#     # (optional) you can inspect logger.warnings/errors here if desired
#     return mp3_paths

# def concat_mp3s(mp3_paths: list[str], output_path: str) -> None:
#     """
#     Concatenate multiple MP3s into one using ffmpeg concat demuxer.
#     Properly quote paths for ffmpeg (not shell quoting).
#     """
#     if len(mp3_paths) == 1:
#         os.replace(mp3_paths[0], output_path)
#         return

#     def ff_quote(p: str) -> str:
#         # ffmpeg concat file expects: file '<path>' with single quotes
#         # escape existing single quotes and backslashes
#         return p.replace("\\", r"\\").replace("'", r"'\''")

#     with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as f:
#         for p in mp3_paths:
#             f.write(f"file '{ff_quote(os.path.abspath(p))}'\n")
#         list_path = f.name

#     cmd = [
#         "ffmpeg", "-y",
#         "-f", "concat", "-safe", "0",
#         "-i", list_path,
#         "-c:a", "libmp3lame", "-q:a", "2",
#         output_path,
#     ]
#     try:
#         completed = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
#     finally:
#         try: os.remove(list_path)
#         except OSError: pass
#     if completed.returncode != 0:
#         raise RuntimeError(completed.stderr.decode("utf-8", errors="ignore"))


# yt.py
import os, json, re, subprocess, tempfile, yt_dlp

class CollectLogger:
    def __init__(self):
        self.warnings, self.errors, self.infos = [], [], []
    def debug(self, msg):   self.infos.append(str(msg))
    def info(self, msg):    self.infos.append(str(msg))
    def warning(self, msg): self.warnings.append(str(msg))
    def error(self, msg):   self.errors.append(str(msg))

YOUTUBE_RE = re.compile(r'^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+', re.IGNORECASE)

def is_url(s: str) -> bool:
    return bool(YOUTUBE_RE.match(s.strip()))

def parse_links_field(raw: str) -> list[str]:
    if not raw: return []
    raw = raw.strip()
    try:
        maybe = json.loads(raw)
        urls = [str(x).strip() for x in maybe] if isinstance(maybe, list) else [raw]
    except Exception:
        urls = [p.strip() for p in re.split(r'[\n,\s]+', raw) if p.strip()]
    return [u for u in urls if is_url(u)]

def _build_extractor_args():
    """
    Prefer web client. If a PO token is available, you can switch to mweb with it.
    Set env var YTDLP_PO_TOKEN_MWEB like 'mweb.gvs+XXXX...'
    See: https://github.com/yt-dlp/yt-dlp/wiki/PO-Token-Guide
    """
    po_token = os.getenv("YTDLP_PO_TOKEN_MWEB", "").strip()
    if po_token:
        return {"youtube": {"player_client": ["mweb"], "po_token": [po_token]}}
    # default: plain web client (no token)
    return {"youtube": {"player_client": ["web"]}}

def download_youtube_audios(urls: list[str], out_dir: str) -> list[str]:
    """
    Download each YouTube URL as MP3 into out_dir using yt-dlp (+ffmpeg),
    writing safe filenames (video ID only) to avoid ffmpeg concat quoting issues.
    Returns list of absolute MP3 paths.
    """
    os.makedirs(out_dir, exist_ok=True)
    logger = CollectLogger()

    # Try formats that usually don’t need PO tokens
    # m4a is often available with the web client
    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio/best",
        "outtmpl": os.path.join(out_dir, "%(id)s.%(ext)s"),
        "restrictfilenames": True,
        "windowsfilenames": True,
        "overwrites": True,
        "quiet": True,
        "noprogress": True,
        "logger": logger,
        "extractor_args": _build_extractor_args(),
        "noplaylist": True,
        # Optional: if running locally with a logged-in browser, uncomment one of these:
        # "cookiesfrombrowser": ("chrome",),   # auto-read cookies from Chrome
        # "cookiefile": "/path/to/cookies.txt",# or export cookies manually
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
    }

    mp3_paths: list[str] = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for url in urls:
            try:
                info = ydl.extract_info(url, download=True)
                vid = info.get("id")
                # After post-processing, extension will be .mp3
                candidate = os.path.join(out_dir, f"{vid}.mp3") if vid else None
                if candidate and os.path.exists(candidate):
                    mp3_paths.append(candidate)
                else:
                    # last-resort scan
                    found = None
                    for name in os.listdir(out_dir):
                        if vid and vid in name and name.lower().endswith(".mp3"):
                            found = os.path.join(out_dir, name)
                            break
                    if found:
                        mp3_paths.append(found)
                    else:
                        # If nothing downloaded, surface helpful context
                        warn = "\n".join(logger.warnings[-6:])
                        err  = "\n".join(logger.errors[-6:])
                        raise RuntimeError(
                            f"Downloaded files not found for id {vid or '?'}.\n"
                            f"[yt-dlp warnings]\n{warn}\n[yt-dlp errors]\n{err}\n"
                            "Tip: update yt-dlp, try web client+m4a, or set YTDLP_PO_TOKEN_MWEB."
                        )
            except Exception as e:
                logger.error(f"{url}: {e}")

    return mp3_paths

def concat_mp3s(mp3_paths: list[str], output_path: str) -> None:
    """(unchanged)"""
    if len(mp3_paths) == 1:
        os.replace(mp3_paths[0], output_path)
        return
    def ff_quote(p: str) -> str:
        return p.replace("\\", r"\\").replace("'", r"'\''")
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as f:
        for p in mp3_paths:
            f.write(f"file '{ff_quote(os.path.abspath(p))}'\n")
        list_path = f.name
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path, "-c:a", "libmp3lame", "-q:a", "2", output_path]
    try:
        completed = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    finally:
        try: os.remove(list_path)
        except OSError: pass
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.decode("utf-8", errors="ignore"))
