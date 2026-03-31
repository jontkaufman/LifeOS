FROM python:3.11-slim

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Frontend build
COPY frontend/package.json frontend/package-lock.json* frontend/
RUN cd frontend && npm install --silent

COPY frontend/ frontend/
RUN cd frontend && npm run build

# Backend code
COPY backend/ backend/

# Create data directory
RUN mkdir -p data

EXPOSE 8080

CMD ["python", "backend/main.py"]
