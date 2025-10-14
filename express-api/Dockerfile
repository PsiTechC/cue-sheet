# Use the official Node.js image
FROM node:18-bullseye

# Install ffmpeg (includes ffprobe)
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set the environment variable for Render
ENV NODE_ENV=production

# Expose the application port
EXPOSE 6006

# Start the application
CMD ["npm", "start"]
