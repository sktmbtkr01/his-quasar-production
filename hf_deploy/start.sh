#!/bin/bash

# 1. Start Predictive ML Service (Port 5002) - NOW USING UVICORN
echo "Starting Predictive ML Service..."
cd /app/ml_predictive/predictive_analytics
# Ensure port env var is set if app.py uses it as fallback, 
# but we also pass it to uvicorn directly if run via uvicorn command.
# However, app.py has `if __name__ == "__main__": uvicorn.run(...)`
# So running python app.py is still fine, OR we can run uvicorn module directly.
# Let's run python app.py to use the logic we just wrote at the bottom of the file.
export FLASK_PORT=5002
python app.py > /app/logs_predictive.txt 2>&1 &
PREDICTIVE_PID=$!

# 2. Start OCR Service (Port 8000)
echo "Starting OCR Service..."
cd /app/ml_ocr/app
# OCR app also has main block with uvicorn.run
python main.py > /app/logs_ocr.txt 2>&1 &
OCR_PID=$!

# 3. Start Node.js Backend (Main Process, Port 7860)
echo "Starting Node.js Backend..."
cd /app/backend
# Ensure PORT is passed to Node
export PORT=7860
# Start application
npm start
