# R Script for estimation applicabillity tool

#####################
# Training function #
#####################

# Matching user story
#####################
# As a user I want to choose a default machine learning algorithm and provide training data.
# I want a default model to be set up with my inputs and I want it to be trained with the training data I provided.
# In the end I want to be able to download the my new model.

# When is the script used/executed?
################################### 
# If the user chooses a default machine learning algorithm and provides training data.

# What does the script do?
##########################
# Sets up a default model, trains it with the training data based on satellite imagery and returns the trained model.

# Inputs
########
# -Information about the algorithm to be used.
# -Training Polygons
# -Satellite imagery for the training data (provided by another script and stored on the server)

# Outputs
#########
# -Trained model as .rds file

# setwd("~/Documents/Studium/5. Semester/Geosoftware_II/geo-tech-project/backend")
# algorithm = 'rf'
# trainingDataPath = './public/uploads/trainingsdaten_muenster_32632.gpkg'
# hyperparameter = c(7)
# hyperparameter = c(1, 1)
# desiredBands = c("B01","B02","B03","B04","B05","B06","B07","B08","B8A","B09","B11","B12", "SCL")
# additionalIndices = c("NDVI", "NDVI_SD_3x3", "NDVI_SD_5x5", "BSI", "BAEI")


training <- function(algorithm, trainingDataPath, hyperparameter, desiredBands, additionalIndices) {

  # load packages
  library(raster)
  library(caret)
  library(CAST)
  library(lattice)
  library(sf)
  library(Orcs)
  library(jsonlite)
  library(kernlab)

  
  # load raster stack from data directory
  stack <- stack("R/processed_sentinel_images/trainingData.tif")
  
  # name the stack bands
  names(stack) <-  desiredBands

  # drop the SCL band
  stack <- dropLayer(stack, length(names(stack)))

  # create additionalIndices bands
  if ('NDVI' %in% additionalIndices) {
    stack$NDVI <- (stack$B08-stack$B04)/(stack$B08+stack$B04)
  }
  if ('NDVI_SD_3x3' %in% additionalIndices) {
    stack$NDVI_SD_3x3 <- focal(stack$NDVI,w=matrix(1/9, nc=3, nr=3), fun=sd, na.rm=TRUE)
  }
  if ('NDVI_SD_5x5' %in% additionalIndices) {
    stack$NDVI_SD_5x5 <- focal(stack$NDVI,w=matrix(1/25, nc=5, nr=5), fun=sd, na.rm=TRUE)
  }
  if ('BSI' %in% additionalIndices) {
    stack$BSI <- ( (stack$B11 + stack$B04) - (stack$B08 + stack$B02) ) / ( (stack$B11 + stack$B04) + (stack$B08 + stack$B02) )
  }
  if ('BAEI' %in% additionalIndices) {
    stack$BAEI <- (stack$B04 + 0.3) / (stack$B03 + stack$B11)
  }
  
  # load training data
  trainSites <- read_sf(trainingDataPath)

  # transform training data to crs of the stack 
  trainSites <- st_transform(trainSites, crs = crs(stack))
  
  # add polygon column to the traindata, to merge by ID later on
  trainSites$PolygonID <- 1:nrow(trainSites)
  
  # extract pixels from stack, that are completely covered by the training polygons
  extr_pixel <- extract(stack, trainSites, df=TRUE)
  
  # merge extracted pixels (by "ID"/"PolygonID") with the additional information from the trainsites 
  extr <- merge(extr_pixel, trainSites, by.x="ID", by.y="PolygonID")
  
  # set predictor attributes
  predictors <- names(stack) 

  # set response attribute
  response <- "Label"
  
  # create data partition from train data; set percentage of pixels from each polygon will be used (default: 100%)
  trainids <- createDataPartition(extr$ID,list=FALSE,p=1)
  trainDat <- extr[trainids,]

  # make sure that there are no NA-values in the data
  trainDat <- trainDat[complete.cases(trainDat[,predictors]),]  
  
  # create three folds for the spatial-cross-validation which is performed for model training later on
  indices <- CreateSpacetimeFolds(trainDat,spacevar = "ID",k=3,class="Label")
  
  # set trainControl
  ctrl <- trainControl(method="cv", 
                       index = indices$index,
                       savePredictions = TRUE)

  # create tuneGrid with the given hyperparameters 
  if(algorithm == 'rf') {
      tune_grid <- expand.grid( mtry  = c(hyperparameter[1]))
  } else if (algorithm == 'svmRadial'){
      tune_grid <- expand.grid( sigma = c(hyperparameter[1]),
                                C     = c(hyperparameter[2])) 
  }

  # create model through model training
  model <- train(trainDat[,predictors],
                 trainDat[,response],
                 method=algorithm,
                 metric="Kappa",
                 trControl=ctrl,
                 tuneGrid = tune_grid)
  
  # delete files in the folder where the model should be saved into
  files <- list.files(path="./R/model/")
  file.remove(paste("./R/model/",files[1],sep=""))

  # save model as RDS file
  saveRDS(model, file="R/model/model.RDS")

  # return
  return(0)
}




###################################
# Classification and AOA function #
###################################

# Matching user story
#####################
# As a user I want my AoI to be classified based on Sentinel 2 imagery. In addition I want to know how applicable the model is, which I
# used for my classification. Therefore I want the AOA to be calculated for my classification. If the model is not applicable I want to know
# where I need to collect additional training data. In the end it should be possible for me to download my classification, my AOA and
# recomended training locations.

# When is the script used/executed?
################################### 
# In all cases of client usage.

# What does the script do?
##########################
# Calculates the classification, the AOA for the given AoI (based on satellite imagery cropped and calculated in another script) and
# further recommended training locations.
# In the end all three parts are returned and stored to make them available as downloads.

# Inputs
########
# -The trained model to use for calculations
# -Satellite imagery for AoI (provided by another script and stored on the server)

# Outputs
#########
# -Classification
# -AOA
# -Recommended training locations

# modelPath = "R/model/model.RDS"
# desiredBands = c("B01","B02","B03","B04","B05","B06","B07","B08","B8A","B09","B11","B12", "SCL")

classifyAndAOA <- function(modelPath, desiredBands, additionalIndices) {

  # load packages
  library(raster)
  library(CAST) 
  library(tmap)
  library(latticeExtra)
  library(doParallel)
  library(parallel)
  library(Orcs)
  library(sp)
  library(rgeos)
  library(geojson)
  library(rjson)
  library(kernlab)
  
  # delete old predition.tif and aoa.tif from target directory
  files <- list.files(path="./R/prediction_and_aoa/")
  for (i in 1:length(files)) {
    file.remove(paste("./R/prediction_and_aoa/",files[i],sep=""))
  }

  # load raster stack from data directory
  stack <- stack("./R/processed_sentinel_images/aoi.tif")

  # name the stack bands
  names(stack) <- desiredBands

  # drop the SCL band
  stack <- dropLayer(stack, length(names(stack)))

  # create additionalIndices bands
  if ('NDVI' %in% additionalIndices) {
    stack$NDVI <- (stack$B08-stack$B04)/(stack$B08+stack$B04)
  }
  if ('NDVI_SD_3x3' %in% additionalIndices) {
    stack$NDVI_SD_3x3 <- focal(stack$NDVI,w=matrix(1/9, nc=3, nr=3), fun=sd, na.rm=TRUE)
  }
  if ('NDVI_SD_5x5' %in% additionalIndices) {
    stack$NDVI_SD_5x5 <- focal(stack$NDVI,w=matrix(1/25, nc=5, nr=5), fun=sd, na.rm=TRUE)
  }
  if ('BSI' %in% additionalIndices) {
    stack$BSI <- ( (stack$B11 + stack$B04) - (stack$B08 + stack$B02) ) / ( (stack$B11 + stack$B04) + (stack$B08 + stack$B02) )
  }
  if ('BAEI' %in% additionalIndices) {
    stack$BAEI <- (stack$B04 + 0.3) / (stack$B03 + stack$B11)
  }

  # load model from data directory
  model <- readRDS(modelPath)
  
  # check if all predictors are in the data the predictions are made on
  checkPredictors(model, stack)
  
  # predict the land use with the given model
  prediction <- predict(stack,model)

  # write prediction raster to tif in file directory
  writeRaster(prediction, "R/prediction_and_aoa/prediction.tif", overwrite = TRUE)
  
  # initiate parallel computing
  cl <- makeCluster(4)
  registerDoParallel(cl)

  # calculate AOA for the model prediction
  AOA <- aoa(stack, model, cl=cl)

  # write AOA raster to tif in file directory
  writeRaster(AOA$AOA, "R/prediction_and_aoa/aoa.tif", overwrite=TRUE)
  
  # calculate a MultiPolygon from the AOA, which can be seen as the area where the user needs to find further training data
  x <- AOA$AOA@data@values
  furtherTrainAreas <- rasterToPolygons(AOA$AOA, fun = function(x) {x == 0}, dissolve = TRUE)
  furtherTrainAreas <- spTransform(furtherTrainAreas, CRS("+init=epsg:4326"))
  
  # draw 30 random sample points from MultiPolygon that are suggested as area where the user can look for train data to improve the model
  furtherTrainAreas <- spsample(furtherTrainAreas, n = 30, type = "random")
  
  # delete old furtherTrainAreas.geojson from target directory
  files <- list.files(path="./R/further_train_areas/")
  file.remove(paste("./R/further_train_areas/",files[1],sep=""))
  
  # write furtherTrainAreas as geojson to file directory
  furtherTrainAreasGeoJSON <- as.geojson(furtherTrainAreas)
  geo_write(furtherTrainAreasGeoJSON, "R/further_train_areas/furtherTrainAreas.geojson")

  # save all classes of the prediction to a json file for web usage (create a legend)
  vector <- c()
  if(model$method == 'rf') {
    for(class in model$finalModel$classes) {
      vector <- c(vector, class)
    }
  } else if (model$method == 'svmRadial'){
    for(class in model$finalModel@lev) {
      vector <- c(vector, class)
    }
  }
  json <- rjson::toJSON(vector)
  write(json, "R/prediction_and_aoa/classes.json")
  
  # return
  return(0)
}


checkPredictors <- function(model, stack) {
  if (model$method == 'rf') {
    predictors <- model$finalModel$xNames
    bands <- names(stack)
    for (i in 1:length(predictors)) {
      if (!(predictors[i] %in% bands)) {
        return(1)
      }
    }
  } else if (model$method == 'svmRadial') {
    predictors <- names(model$finalModel@scaling$x.scale$`scaled:scale`)
    bands <- names(stack)
    for (i in 1:length(predictors)) {
      if (!(predictors[i] %in% bands)) {
        return(1)
      }
    }
  } else {
    return(4)
  }
}
