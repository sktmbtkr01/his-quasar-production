
FROM python:3.10-slim

# Install system dependencies
# - curl/gnupg: for installing Node.js
# - tesseract-ocr: for OCR service
# - build-essential: for compiling some python/node packages
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    tesseract-ocr \
    libtesseract-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update && apt-get install -y nodejs

# Set work directory
WORKDIR /app

# --- Setup Predictive ML ---
COPY ml_predictive/requirements.txt ./ml_predictive/requirements.txt
RUN pip install --no-cache-dir -r ml_predictive/requirements.txt

# --- Setup OCR ML ---
COPY ml_ocr/requirements.txt ./ml_ocr/requirements.txt
RUN pip install --no-cache-dir -r ml_ocr/requirements.txt

# --- Setup Backend ---
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm install
WORKDIR /app

# Copy all source code
COPY . .

# Create the start script
COPY start.sh .
RUN chmod +x start.sh

# Environment variables for internal services
ENV PREDICTIVE_ML_URL="http://127.0.0.1:5002"
ENV OCR_SERVICE_URL="http://127.0.0.1:8000"
ENV PORT=7860
ENV NODE_ENV="production"

# Expose the HF Space port
EXPOSE 7860

# Start everything
CMD ["./start.sh"]
