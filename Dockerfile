# Use the official lightweight Node.js 20 image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of S.A.R.A.'s source code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose port 8080 (Google Cloud Run's default port)
EXPOSE 8080

# Start the Node.js Express server
# (Adjust "npm start" if your server start script is named differently, like "npm run server")
CMD ["npm", "start"]