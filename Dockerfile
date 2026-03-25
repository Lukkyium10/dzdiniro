# Use the official Puppeteer image — Chrome is already installed!
FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies (skip Chromium download — already in image)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install

# Copy all project files
COPY . .

# Start the worker
CMD ["node", "worker.js"]
