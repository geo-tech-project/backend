# Remove all variables from current environment
rm(list=ls())

############################## FUNCTIONS #######################################
################################################################################

# Function to get the UTM zone from longitude.
# parameters: - longitude (Float) of a coordinate in WGS84
getUTMZone <- function (longitude){
  return( (floor((longitude + 180)/6) %% 60) + 1)
}

# Function that gets the EPSG code from a UTM zone
# All EPSG codes to be returned are in UTM coordinates of WGS84
# parameters: - UTM Zone (Integer)
epsgCodeFromUTMzone <- function(utmZone){
  if(utmZone < 10){
    x <- toString(utmZone)
    string = paste("0",x,sep = "")
    
  }else{
    string = toString(utmZone)
  }
  return(paste("EPSG:326",string, sep=""))
}

# Function that returns the EPSG code of an CRS depending on the longitude.
# All EPSG codes to be returned are in UTM coordinates of WGS84.
# parameters: - longitude (Float) of a coordinate in WGS84
getEPSG <- function(longitude){
  zone <- getUTMZone(longitude)
  epsg <- epsgCodeFromUTMzone(zone)
  return(epsg)
}

# Function to transform a bbox of any CRS to a bbox with a WGS84 CRS.
# parameters: bbox of the area of interest
bboxToWGS84 <- function(bbox){
  library(sf)
  st_as_sfc(bbox) |>
    st_transform("EPSG:4326") |>
    st_bbox() -> bbox_WGS84
  return(bbox_WGS84)
}

# Function that creates a bbox from two coordinates (bottom left and top right coordinates).
# parameters: - bottomLeftX (Float)
#             - bottomLeftY (Float)
#             - topRightX (Float)
#             - topRightY (Float)
getBBoxFromAOI <- function(bottomLeftX,bottomLeftY,topRightX,topRightY) {
  library(rgeos)
  bbox <- rgeos::bbox2SP(n = topRightY, s = bottomLeftY, w = bottomLeftX, e = topRightX,
                         proj4string = CRS("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"))
  return (bbox)
}

# Function that transforms a bbox with a WGS84 CRS to a bbox with the same CRS used in the cube view function.
# parameters: bbox of the area of interest in WGS84
transformBBOXcrsToUTM <- function(bboxWGS84){
  library(rgdal)
  if (!is.null(bboxWGS84@bbox[1,1])){
    crs = getEPSG(bboxWGS84@bbox[1,1])
  }
  else{
    crs = getEPSG(xmin(extent(bboxWGS84)))
  }
  bbox <- spTransform(bboxWGS84, CRS(crs))
  return (bbox)
}

# Function that transforms the training data to the same CRS used in the cube view function.
# parameters: training data
transformTrainingDataToCRSFromCube <- function(trainingData) {
  bbox = st_bbox(trainingData)
  bboxWGS84 = bboxToWGS84(bbox)
  lon = bboxWGS84["xmin"]
  crs = getEPSG(lon)
  trainingDataInCRSFromCube <- st_transform(trainingData, crs)
  return (trainingDataInCRSFromCube)
}

# Function that returns the number of days that are within a date period.
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

# Function that returns useable satellite images from the stac catalogue.
# parameters: - bbox of area of interest in any CRS
#             - datetime (String): (example: "2021-06-01/2021-06-30")
#             - limit (Integer) -> maximum count of found images from stac to be used
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

# Function that creates an image collection.
# parameters: - desiredBands (vector of Strings): c("B01", "B02", "B03", "SCL") (SCL-BAND MUST BE INCLUDED) 
#             - cloudCoverageInPercentage (Float)
#             - items found by the stac request
createImageCollection <- function(desiredBands, cloudCoverageInPercentage, items){
  # TODO : if(item$features == null) Schmeisse entssprechenden Fehler !!!
  library(gdalcubes)
  s2_collection = stac_image_collection(items$features, asset_names = desiredBands, property_filter = function(x) {x[["eo:cloud_cover"]] < cloudCoverageInPercentage})
  return(s2_collection)
}

# Function that creates the view of a cube.
# parameters: - bbox of area of interest in UTM coordinates
#             - resolution in meters (Integer): (options: 10/20/60/100/200/400)
#             - datetime (String): (example: "2021-06-01/2021-06-30")
createCubeView <- function(bboxUTM, resolution, datetime){
  bboxWGS84 = bboxToWGS84(bboxUTM)
  bboxUTM = st_bbox(bboxUTM) # goal: access the bbox in the cube_view function everytime in the same way like (bboxUTM["xmin"])
  lon = bboxWGS84["xmin"]
  crs = getEPSG(lon)
  days = numberOfDaysFromPeriod(datetime) +1
  daysString = paste("P",days,"D",sep = "")
  v.bbox.overview = cube_view(srs= crs,  dx=resolution, dy=resolution, dt= daysString, 
                              aggregation="median", resampling = "average",
                              extent=list(t0 = substr(datetime,0,10), t1 = substr(datetime,12,21),
                              left=bboxUTM["xmin"] - 1000, right=bboxUTM["xmax"] + 1000,
                              top=bboxUTM["ymax"] + 1000, bottom=bboxUTM["ymin"] - 1000))
  return (v.bbox.overview)
}

# Function that creates the needed satellite image from the training data as a tif file.
# parameters: - image collection (from createImageCollection function)
#             - cube view (from createCubeView function)
#             - training data 
createTifFileFromTrainingData <- function(imageCollection, cubeView, trainingData){
  # Set mask for further cloud filtering
  S2.mask = image_mask("SCL", values = c(3,8,9))
  # Create raster cube and filter images by the geometry of the training data
  if (!is.null(trainingData$geom)){
    sentinel <- raster_cube(imageCollection, cubeView, S2.mask) |>
      filter_geom(trainingData$geom)
  }
  else if(!is.null(trainingData$geometry)) {
    sentinel <- raster_cube(imageCollection, cubeView, S2.mask) |>
      filter_geom(trainingData$geometry)
  }
  #print(sentinel)
  write_tif(
    sentinel,
    dir = "./R/outputData",
    prefix = 'trainingData_',
    overviews = FALSE,
    COG = TRUE,
    rsmpl_overview = "nearest",
    creation_options = NULL,
    write_json_descr = FALSE,
    pack = NULL
  )
  files <- list.files(path="./R/outputData/")
  file.rename(paste("./R/outputData/",files[2],sep=""),"./R/outputData/trainingData.tif")
}

# Function that combines all prior functions to one function. It generates a satellite image as a tif file.
# parameters: - trainingDataPath: path to where the training data is stored
#             - datetime (String): (example: "2021-06-01/2021-06-30")
#             - resolution in meters (Integer): (options: 10/20/60/100/200/400)
#             - limit (Integer) -> maximum count of found images from stac to be used
#             - desiredBands (vector of Strings): c("B01", "B02", "B03", "SCL") (SCL-BAND MUST BE INCLUDED) 
#             - cloudCoverageInPercentage (Float)
generateSatelliteImageFromTrainingData <- function(trainingDataPath, datetime, limit, desiredBands, resolution, cloudCoverageInPercentage) {
  library(sf)
  # Read the path to upload the training data
  trainingData <- read_sf(trainingDataPath)
  # Transform training data to the same CRS we use to create the cube view, so that every geometry alligns to each other
  trainingData <- transformTrainingDataToCRSFromCube(trainingData)
  # Set BBOX to bbox of the shape and crs (UTM) from the training data
  bbox = st_bbox(trainingData)
  # Querying images with rstac
  items = stacRequest(bbox, datetime, limit)
  # print(items)
  # Creating an image collection
  imageCollection =  createImageCollection(desiredBands, cloudCoverageInPercentage, items)
  # print(imageCollection)
  # Creating the cube view
  cubeView = createCubeView(bbox, resolution, datetime)
  # print(cubeView)
  # Parallel computing
  gdalcubes_options(threads = 16)
  # Create tif file
  createTifFileFromTrainingData(imageCollection, cubeView, trainingData)
}

# Function that creates the needed satellite image from the training data as a tif file.
# parameters: - image collection (from createImageCollection function)
#             - cube view (from createCubeView function)
createTifFileFromAOI <- function(imageCollection,cubeView){
  files <- list.files(path="./R/outputData/")
  files
  for (i in 1:length(files)) {
    file.remove(paste("./R/outputData/",files[i],sep=""))
    #unlink(paste("./R/outputData/",files[i],sep=""), recursive=TRUE)
  }
  # Set mask for further cloud filtering
  S2.mask = image_mask("SCL", values = c(3,8,9))
  # Create raster cube
  sentinel <- raster_cube(imageCollection, cubeView, S2.mask) 
  #print(sentinel)
  write_tif(
    sentinel,
    dir = "./R/outputData",
    prefix = "aoi_",
    overviews = FALSE,
    COG = TRUE,
    rsmpl_overview = "nearest",
    creation_options = NULL,
    write_json_descr = FALSE,
    pack = NULL
  )
  files <- list.files(path="./R/outputData/")
  file.rename(paste("./R/outputData/",files[1],sep=""),"./R/outputData/aoi.tif")

}

# Function that combines all prior functions to one function. It generates a satellite image as a tif file.
# parameters: - bottomLeftX (Float)
#             - bottomLeftY (Float)
#             - topRightX (Float)
#             - topRightY (Float)
#             - datetime (String): (example: "2021-06-01/2021-06-30")
#             - resolution in meters (Integer): (options: 10/20/60/100/200/400)
#             - limit (Integer) -> maximum count of found images from stac to be used
#             - desiredBands (vector of Strings): c("B01", "B02", "B03", "SCL") (SCL-BAND MUST BE INCLUDED) 
#             - cloudCoverageInPercentage (Float)
generateSatelliteImageFromAOI <- function(bottomLeftX,bottomLeftY,topRightX,topRightY,datetime,limit,desiredBands,resolution,cloudCoverageInPercentage) {
  # Create bbox of coordinates
  bboxWGS84 <- getBBoxFromAOI(bottomLeftX,bottomLeftY,topRightX,topRightY)
  # Transform bbox CRS to the same CRS we use to create the cube view, so that every geometry alligns to each other
  bboxUTM <- transformBBOXcrsToUTM(bboxWGS84)
  # Querying images with rstac
  items = stacRequest(bboxUTM, datetime, limit)
  print(items)
  # Creating an image collection
  imageCollection =  createImageCollection(desiredBands, cloudCoverageInPercentage, items)
  print(imageCollection)
  # Creating the cube view
  cubeView = createCubeView(bboxUTM, resolution, datetime)
  print(cubeView)
  # Parallel computing
  gdalcubes_options(threads = 16)
  # Create tif file
  createTifFileFromAOI(imageCollection, cubeView)
}

# Function that loads and plots a tif file depending on a file path.
# parameters: - filePath: path to the stored tif
plotTifFile <- function(filePath){
  library(raster)
  sentinel <- stack(filePath)
  sentinel
  plotRGB(sentinel, r=3, g=2, b=1, stretch = "lin")
}

########################### PARAMETER for tests ################################
################################################################################

# library(sf)
# trainingDataPath = "./R/Trainingsdaten/trainingsdaten_suedgeorgien_4326.gpkg" #trainingdata should be located in the R folder of the backend
# datetime = "2020-06-01/2021-06-30"
# limit = 100
# desiredBands = c("B02","B03","B04","SCL")
# resolution = 20
# cloudCoverageInPercentage = 20

########################## Test for training data ##############################
################################################################################

# First set your working directory to your github 
# getwd()
# setwd("~/GitHub/backend")
# 
# # Read the path to get the training data
# trainingData = read_sf(trainingDataPath)
# 
# # Transform training data to the same CRS we use to create the cube view, so that every geometry alligns to each other
# trainingData <- transformTrainingDataToCRSFromCube(trainingData)
# 
# #Set BBOX to bbox of the shape from the training data
# bbox = st_bbox(trainingData)
# bbox
# 
# # Querying images with rstac
# items = stacRequest(bbox, datetime, limit)
# items
# 
# # Creating an image collection
# imageCollection = createImageCollection(desiredBands, cloudCoverageInPercentage, items)
# imageCollection
# 
# # Creating the cube view
# cubeView = createCubeView(bbox, resolution, datetime)
# cubeView
# 
# # Parallel computing
# gdalcubes_options(threads = 16)
# 
# # Create tif file
# createTifFileFromTrainingData(imageCollection, cubeView, trainingData)
# 
# # Function to do all at once
# generateSatelliteImageFromTrainingData(trainingDataPath, datetime, limit, desiredBands, resolution, cloudCoverageInPercentage)
# 
# # Plot the resulting tif file
# plotTifFile("./R/outputData/trainingData.tif")

############################## Test for AOI ####################################
################################################################################

# First set your working directory to your github 
# getwd()
# setwd("~/GitHub/backend")
# 
# # Create bbox of coordinates of the AOI
# bboxWGS84 <- getBBoxFromAOI(7,50,7.1,50.1)
# bboxWGS84
# 
# # Transform bbox CRS to the same CRS we use to create the cube view, so that every geometry alligns to each other
# bboxUTM <- transformBBOXcrsToUTM(bboxWGS84)
# bboxUTM
# 
# # Querying images with rstac
# items = stacRequest(bboxUTM, datetime, limit)
# items
# 
# # Creating an image collection
# imageCollection =  createImageCollection(desiredBands, resolution, items)
# imageCollection
# 
# # Creating the cube view
# cubeView = createCubeView(bboxUTM, resolution, datetime)
# cubeView
# 
# # Parallel computing
# gdalcubes_options(threads = 16)
# 
# # Create tif file
# createTifFileFromAOI(imageCollection, cubeView)

# Function to do all at once
# generateSatelliteImageFromAOI(7,50,7.1,50.1, datetime, 100, desiredBands, resolution, cloudCoverageInPercentage)

# Plot the resulting tif file
# plotTifFile("./R/outputData/aoi.tif")


