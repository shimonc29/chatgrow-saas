#!/bin/bash

# Start backend on port 3000 in background
PORT=3000 node src/index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend on port 5000
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
