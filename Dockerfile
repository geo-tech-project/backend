# Create image based on the official Node 6 image from the dockerhub
FROM node:12.16.3

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

RUN apt-get update -y && apt-get install -y r-base

# Copy dependency definitions
COPY package.json /usr/src/app

# Install dependencies
RUN npm install

# Get all the code needed to run the app
COPY . /usr/src/app

# Expose the port the app runs in
EXPOSE 8781

# Serve the app
CMD ["npm", "start"]