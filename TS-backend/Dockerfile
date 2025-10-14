FROM python:3.9-bullseye AS builder

WORKDIR /app

# Install system dependencies and build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-dev \
    qtbase5-dev \
    qttools5-dev-tools \
    python3-pyqt5 \
    python3-pyqt5.qtwebengine \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set Python path explicitly for system packages
ENV PYTHONPATH="/usr/lib/python3/dist-packages"

# Upgrade pip, setuptools, and wheel
RUN pip install --no-cache-dir -U pip setuptools wheel

# Install Python dependencies
RUN pip install --no-cache-dir Flask requests schedule flask-cors python-dotenv pydub openai-whisper>=1.0.1 torch>=2.0 gunicorn

# Set persistent cache directory for Whisper models
ENV WHISPER_CACHE_DIR="/app/whisper-models"
RUN mkdir -p /app/whisper-models && chmod -R 777 /app/whisper-models

# Pre-download the Whisper "base" model
RUN python3 -c "import whisper; whisper.load_model('base')"

# Copy project files
COPY . /app

# Expose Flask port
EXPOSE 8000

# Command to run the WSGI server with increased timeout
CMD ["gunicorn", "-w", "1", "--timeout", "3600", "-b", "0.0.0.0:8000", "ts:app"]

