# Stage 1: Build the Visual Cortex (React Frontend)
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# This compiles the React app into highly optimized static files
RUN npm run build 

# Stage 2: Build the Brain Stem (Node.js Backend)
FROM node:20-alpine
WORKDIR /app/server
COPY server/package*.json ./
# Install only production backend dependencies
RUN npm install --production
COPY server/ .

# Fuse them together: Copy the React build into the Node server's public folder
COPY --from=frontend-builder /app/dist ./public

# Expose S.A.R.A. to the universe
EXPOSE 8080

# Wake her up
CMD ["node", "server.js"]