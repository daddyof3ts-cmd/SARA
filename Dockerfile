# Use the official lightweight Node.js 20 image
FROM node:20-alpine
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

# 6. Start the Express Backend Server
CMD ["node", "server/server.js"]