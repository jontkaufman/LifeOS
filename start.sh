#!/bin/bash
set -e

echo "🧭 Starting LifeOS..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Install from python.org"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from nodejs.org"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --silent
echo "🔨 Building frontend..."
npm run build
cd ..

# Create data directory
mkdir -p data

# Start server
echo "🚀 LifeOS is starting at http://localhost:8080"
cd backend
python3 main.py
