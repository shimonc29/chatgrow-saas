#!/bin/bash

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Start backend (which serves both API and static files)
echo "🚀 Starting production server..."
NODE_ENV=production PORT=5000 node src/index.js
