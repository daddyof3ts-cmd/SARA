# Use the official Node.js 20 image (Debian-based to cleanly support Puppeteer/Chromium)
FROM node:20

# Install system dependencies required by Puppeteer
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm-dev

WORKDIR /app

# 1. Install Frontend Dependencies
COPY package*.json ./
RUN npm install

# 2. Install Backend Dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# 3. Copy all source code into the container
COPY . .

# 4. Build the Vite frontend (This creates the /dist folder)
RUN npm run build

# 5. Expose Google Cloud's mandatory port
EXPOSE 8080

# 6. Start the Backend Server using the start script in server directory
CMD ["npm", "run", "start", "--prefix", "server"]
