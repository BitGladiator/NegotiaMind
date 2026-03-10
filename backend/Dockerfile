# Use official Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching — only re-runs npm install if package.json changes)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy rest of the source code
COPY . .

# Expose the app port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]