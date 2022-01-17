# Create image based on the official Node 6 image from the dockerhub
FROM node:12.16.3

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package.json /usr/src/app

# Install dependencies
RUN npm install

RUN apt-get update && apt-get install -y \
    build-essential curl libcurl4-openssl-dev apt-utils \
    r-base r-base-dev libssl-dev \
    libudunits2-dev libproj-dev libgdal-dev libgeos-dev libssl-dev\
    && rm -rf /var/lib/apt/lists/*
RUN apt-get upgrade
# Get all the code needed to run the app
COPY . .

RUN Rscript --vanilla /usr/src/app/testR.R

# Expose the port the app runs in
EXPOSE 8781

# Serve the app
CMD ["npm", "start"]