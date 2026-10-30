FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gstreamer1.0-tools \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    libgirepository1.0-dev \
    libcairo2-dev \
    pkg-config \
    python3-dev \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/media-gateway/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY services/media-gateway /app/

EXPOSE 1935

CMD ["python3", "gateway.py"]
