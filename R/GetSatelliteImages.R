# Remove all variables from current environment
rm(list=ls())
# getwd()
# trainingDataPath <- "./Trainingsdaten/trainingsdaten_kenia_21097.gpkg"
# datetime = "2021-06-01/2021-06-30"
# limit = 100
# desiredBands = c("B02","B03","B04","SCL")
# resolution = 400
# cloudCoverageInPercentage = 20
#library(gdalcubes)

################################################################################
################################################################################

# Load all necessary functions


# Function to get the UTM zone from longitude
# parameters: - longitude of a coordinate in WGS84
getUTMZone <- function (longitude){
  return( (floor((longitude + 180)/6) %% 60) + 1)
}

# Function that gets the EPSG code from a UTM zone
# All EPSG codes to be returned are in UTM coordinates of WGS84
# parameters: - UTM Zone
epsgCodeFromUTMzone <- function(utmZone){
  if(utmZone < 10){
    x <- toString(utmZone)
    string = paste("0",x,sep = "")
    
  }else{
    string = toString(utmZone)
  }
  return(paste("EPSG:326",string, sep=""))
}

# Function that returns the EPSG code of an crs depending on the longitude
# All EPSG codes to be returned are in UTM coordinates of WGS84
# parameters: - longitude of a coordinate in WGS84
getEPSG <- function(longitude){
  zone <- getUTMZone(longitude)
  epsg <- epsgCodeFromUTMzone(zone)
  return(epsg)
}


# Function to get items from stac
# parameters: - bbox of area of interest
#             - datetime (String): (example: "2021-06-01/2021-06-30")
#             - limit (integer) -> maximum count of items
stacRequest <- function(bbox, datetime, limit) {
  library(rstac)
  s = stac("https://earth-search.aws.element84.com/v0")
  bbox = bboxToWGS84(bbox)
  items = s |>
    stac_search(collections = "sentinel-s2-l2a-cogs",
                bbox = c(bbox["xmin"],bbox["ymin"],
                         bbox["xmax"],bbox["ymax"]), 
                datetime = datetime,
                limit = limit) |>
    post_request()
  return(items)
}

# Function to transform a bbox of any crs to a bbox with a WGS84 crs
# parameters: bbox of the area of interest
bboxToWGS84 <- function(bbox){
  library(sf)
  st_as_sfc(bbox) |>
    st_transform("EPSG:4326") |>
    st_bbox() -> bbox_WGS84
  return(bbox_WGS84)
} 

# Function that returns the number of days that are within a dateperiod
# parameters: - datetime (String): "YYYY-MM-DD/YYYY-MM-DD"
numberOfDaysFromPeriod <- function(datetime) {
  date1 <- substr(datetime,12,21)
  date1 <- gsub(pattern = "-", replacement = "/",date1, fixed = TRUE)
  date2 <- substr(datetime,0,10)
  date2 <- gsub(pattern = "-", replacement = "/",date2, fixed = TRUE)
  survey <- data.frame(date=date1, tx_start=date2)
  survey$date_diff <- as.Date(as.character(survey$date), format="%Y/%m/%d")-
    as.Date(as.character(survey$tx_start), format="%Y/%m/%d")
  survey$date_diff<-as.numeric(survey$date_diff)
  return(survey$date_diff)
}

# Function that creates an image collection
# parameters: - desiredBands (vector of Strings): c("B01", "B02", "B03", "SCL") (SCL-BAND MUST BE INCLUDED) 
#             - cloudCoverageInPercentage (Float)
#             - items found by the stac request
createImageColletion <- function(desiredBands, cloudCoverageInPercentage, items){
  library(gdalcubes)
  s2_collection = stac_image_collection(items$features, asset_names = desiredBands, property_filter = function(x) {x[["eo:cloud_cover"]] < cloudCoverageInPercentage})
  return(s2_collection)
}

# Function that creates the view of a cube
# parameters: - bbox of area of interest
#             - resolution in meters (Integer): (options: 10/20/60/100/200/400)
#             - datetime (String): (example: "2021-06-01/2021-06-30")
createCubeView <- function(bbox, resolution, datetime){
  bboxWGS84 = bboxToWGS84(bbox)
  lon = bboxWGS84["xmin"]
  crs = epsgCodeFromUTMzone(getUTMZone(lon))
  days = numberOfDaysFromPeriod(datetime) +1
  daysString = paste("P",days,"D",sep = "")
  v.bbox.overview = cube_view(srs= crs,  dx=resolution, dy=resolution, dt= daysString, 
                              aggregation="median", resampling = "average",
                              extent=list(t0 = substr(datetime,0,10), t1 = substr(datetime,12,21),
                                          left=bbox["xmin"] - 1000, right=bbox["xmax"] + 1000,
                                          top=bbox["ymax"] + 1000, bottom=bbox["ymin"] - 1000))
  return (v.bbox.overview)
}


createTifFileFromTrainingData <- function(imageCollection, cubeView, trainingData){
  # Set mask for further cloud filtering
  S2.mask = image_mask("SCL", values = c(3,8,9))
  # Create raster cube
  sentinel <- raster_cube(imageCollection, cubeView, S2.mask) |>
    filter_geom(trainingData$geom)
  write_tif(
    sentinel,
    dir = "~/GitHub/backend/R",
    prefix = "",
    overviews = FALSE,
    COG = TRUE,
    rsmpl_overview = "nearest",
    creation_options = NULL,
    write_json_descr = FALSE,
    pack = NULL
  )
}

#####NOT READY YET
createTifFileFromAOI <- function(imageCollection, cubeView, AOI){
  bbox <- 
  # Set mask for further cloud filtering
  S2.mask = image_mask("SCL", values = c(3,8,9))
  # Create raster cube
  sentinel <- raster_cube(imageCollection, cubeView, S2.mask)
  write_tif(
    sentinel,
    dir = "~/GitHub/backend/R",
    prefix = "",
    overviews = FALSE,
    COG = TRUE,
    rsmpl_overview = "nearest",
    creation_options = NULL,
    write_json_descr = FALSE,
    pack = NULL
  )
}



generateSatelliteImageFromTrainingData <- function(trainingDataPath, datetime, limit, desiredBands, resolution, cloudCoverageInPercentage) {
  library(sf)
  trainingData <- read_sf(trainingDataPath)
  # Transform training data to the same CRS we use to create the cube view, so that every geometry alligns to each other
  trainingData <- transformTrainingDataToEPSGFromCube(trainingData)
  # Set BBOX to bbox of the shape from the training data
  bbox = st_bbox(trainingData)
  # Querying images with rstac
  items = stacRequest(bbox, datetime, limit)
  # Creating an image collection
  # print(desiredBands)
  desiredBands <- unlist(strsplit(desiredBands,','))
  # desiredBands <- c(desiredBands)
  # print(desiredBands)
  # print(bands)
  imageCollection =  createImageColletion(desiredBands, cloudCoverageInPercentage, items)
  # Creating the cube view
  cubeView = createCubeView(bbox, resolution, datetime)
  # Parallel computing?
  gdalcubes_options(threads = 16)
  createTifFileFromTrainingData(imageCollection, cubeView, trainingData)
}

transformTrainingDataToEPSGFromCube <- function(trainingData) {
  bbox = st_bbox(trainingData)
  bboxWGS84 = bboxToWGS84(bbox)
  lon = bboxWGS84["xmin"]
  crs = epsgCodeFromUTMzone(getUTMZone(lon))
  trainingData <- st_transform(trainingData, crs)
  return (trainingData)
}

plotTifFile <- function(filePath){
  library(raster)
  sentinel <- stack(filePath)
  sentinel
  plotRGB(sentinel, r=3, g=2, b=1, stretch = "lin")
}
################################################################################
################################################################################

# First set your working directory to your github folder
#setwd("~/GitHub/backend/R")

# Load tmap for visualization
#library(tmap)
#tmap_mode("view")

# Visualize the training data with tmap
#tmap_options(check.and.fix = TRUE)
#tm_shape(st_geometry(trainingData)) +  tm_polygons()


#Set variables
#library(sf)
# trainingData = "./Trainingsdaten/trainingsdaten_kenia_2_4326.gpkg" #trainingdata should be located in the R folder of the backend
#datetime = "2021-06-01/2021-06-30"
#limit = 100
#desiredBands = c("B02","B03","B04","SCL")
#resolution = 400
#cloudCoverageInPercentage = 99

# Transform training data to the same CRS we use to create the cube view, so that every geometry alligns to each other
#trainingData <- transformTrainingDataToEPSGFromCube(trainingData)

#Set BBOX to bbox of the shape from the training data
#bbox = st_bbox(trainingData)
#bbox

# Querying images with rstac
#items = stacRequest(bbox, datetime, limit)
#items
# Creating an image collection
#imageCollection = createImageColletion(desiredBands, cloudCoverageInPercentage, items)
#imageCollection
# Creating the cube view
#cubeView = createCubeView(bbox, resolution, datetime)
#cubeView
# Parallel computing?
#library(gdalcubes)
#gdalcubes_options(threads = 16)
#createTifFileFromTrainingData(imageCollection, cubeView, trainingData)

generateSatelliteImageFromTrainingData(trainingDataPath, datetime, limit, desiredBands, resolution, cloudCoverageInPercentage)
plotTifFile("2021-06-01.tif")

# Load tif file to proof if everything is correct
# library(raster)
# sentinel <- stack("./2021-06-01.tif")
# sentinel
# plotRGB(sentinel, r=3, g=2, b=1, stretch = "lin")

