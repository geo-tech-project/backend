# Create image based on the official Node 6 image from the dockerhub
#!/usr/bin/env Rscript
FROM node:latest

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package.json /usr/src/app

# Install dependencies
RUN npm install

RUN apt-get update && apt-get install -y \
    build-essential curl libcurl4-openssl-dev apt-utils libjq-dev systemctl\
    r-base r-base-dev libssl-dev libprotobuf-dev protobuf-compiler\
    libudunits2-dev libproj-dev libgdal-dev libgeos-dev libssl-dev libv8-dev\
    && rm -rf /var/lib/apt/lists/*
RUN apt install -y libprotobuf-dev protobuf-compiler
RUN apt-get upgrade

RUN R -e "Sys.setenv(TZ='Europe/Berlin')"
RUN R -e "install.packages('terra', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('rgdal', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('rgeos', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('rstac', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('gdalcubes', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('raster', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('caret', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('CAST', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('lattice', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('Orcs', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('jsonlite', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('tmap', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('latticeExtra', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('doParallel', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('parallel', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('sp', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('geojson', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('rjson', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"
RUN R -e "install.packages('randomForest', dependencies=TRUE, repos='https://cran.uni-muenster.de/')"

# Get all the code needed to run the app
COPY . .


# Expose the port the app runs in
EXPOSE 8781

# Serve the app
CMD ["npm", "start"]