# Use Node 20 (LTS)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the port your server runs on
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]