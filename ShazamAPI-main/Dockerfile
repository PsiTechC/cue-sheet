# Use Python 3.9 as the base image
FROM python:3.9-slim-bullseye

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1-mesa-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir -U pip setuptools wheel

# Install Python dependencies
RUN pip install --no-cache-dir Flask requests werkzeug mutagen flask-cors python-dotenv pydub gunicorn schedule boto3 botocore uuid

# Copy all project files to the working directory
COPY . /app

# Expose port 8000 for the Flask application
EXPOSE 8000

# Command to run the WSGI server
CMD ["gunicorn", "-w", "10", "--timeout", "36000","--graceful-timeout","18000", "-b", "0.0.0.0:8000", "app:app"]
