FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose ports for Expo Metro Bundler
EXPOSE 8081

# Start the Expo development server
CMD ["npm", "start"]
