# Build Stage
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy dependency definition manifest files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source files
COPY . .

# Expose backend service listening port
EXPOSE 5000

# Set environment execution mode to production
ENV NODE_ENV=production

# Start application server
CMD ["node", "app.js"]
