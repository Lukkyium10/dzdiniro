# Use the official Puppeteer image — Chrome is already installed!
FROM ghcr.io/puppeteer/puppeteer:21.11.0

# Switch to root to install dependencies
USER root

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies (skip Chromium download — already in image)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install

# Copy all project files
COPY . .

# Switch back to the puppeteer user for security
USER pptruser

# Start the worker
CMD ["node", "worker.js"]
