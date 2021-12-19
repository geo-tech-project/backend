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
# setwd("~/Documents/Studium/5. Semester/Geosoftware II/geo-tech-project/backend")
# algorithm = 'rf'
# trainingDataPath = './public/uploads/trainingsdaten_koeln_4326.gpkg'
# hyperparameter = c(2)
# desiredBands = c("B02", "B03", "B04", "SCL")



training <- function(algorithm, trainingDataPath, hyperparameter, desiredBands) {


  # load packages
  library(raster)
  library(caret)
  library(CAST)
  library(lattice)
  library(sf)
  library(Orcs)
  library(jsonlite)
  
  # load raster stack from data directory
  stack <- stack("R/outputData/trainingData.tif")
  names(stack) <-  desiredBands
  
  # load training data
  trainSites <- read_sf(trainingDataPath)
  trainSites <- st_transform(trainSites, crs = crs(stack))
  
  # Ergänze PolygonID-Spalte falls nicht schon vorhanden, um später mit extrahierten Pixeln zu mergen
  trainSites$PolygonID <- 1:nrow(trainSites)
  
  # Extrahiere Pixel aus den Stack, die vollständig (das Zentrum des Pixels wird abgedeckt) vom Polygon abgedeckt werden
  extr_pixel <- extract(stack, trainSites, df=TRUE)
  
  # Merge extrahierte Pixel mit den zusätzlichen Informationen aus den 
  extr <- merge(extr_pixel, trainSites, by.x="ID", by.y="PolygonID")
  
  # Prädiktoren und Response festlegen
  predictors <- names(stack)
  predictors <- predictors[! predictors %in% c('SCL')]
  response <- "Label"
  
  
  # 50% der Pixel eines jeden Polygons für das Modeltraining extrahieren
  trainids <- createDataPartition(extr$ID,list=FALSE,p=0.5)
  trainDat <- extr[trainids,]

  # Sicherstellen das kein NA in Prädiktoren enthalten ist:
  trainDat <- trainDat[complete.cases(trainDat[,predictors]),]  
  
  
  
  # Drei Folds für die Spatial-Cross-Validation im Modell Training definieren und traincontrol festlegen
  indices <- CreateSpacetimeFolds(trainDat,spacevar = "ID",k=3,class="Label")
  ctrl <- trainControl(method="cv", 
                       index = indices$index,
                       savePredictions = TRUE)

  #Erstellen eines Grids für die Hyperparameter des jeweiligen Algorithmus: 
  #hyperparameter <- fromJSON(data)
  if(algorithm == 'rf') {
      tune_grid <- expand.grid( mtry  = c(hyperparameter[1]))
  } else if (algorithm == 'svmRadial'){
      tune_grid <- expand.grid( sigma = c(hyperparameter[1]),
                                C     = c(hyperparameter[2])) 
  }
 # else if (algorithm == 'xgbTree') {
 #     tune_grid <- expand.grid( nrounds           = c(hyperparameter[1]),
 #                               max_depth         = c(hyperparameter[2]),
 #                               eta               = c(hyperparameter[3]),
 #                               gamma             = c(hyperparameter[4]),
 #                               colsample_bytree  = c(hyperparameter[5]),
 #                               min_child_weight  = c(hyperparameter[6]),
 #                               subsample         = c(hyperparameter[7]))
 # } 


  
  #Erstellen (Training) des Models
  model <- train(trainDat[,predictors],
                 trainDat[,response],
                 method=algorithm,
                 metric="Kappa",
                 trControl=ctrl,
                 tuneGrid = tune_grid)
                 #tuneLength = 10) // bin mir nicht sicher welche Auswirkung der Parameter hat
                 #importance=TRUE,
                 #ntree=trees)
  
  saveRDS(model, file="R/tempModel/model.RDS")
  
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

# modelPath = "R/tempModel/model.RDS"
# desiredBands = c("B02", "B03", "B04", "SCL")

classifyAndAOA <- function(modelPath, desiredBands) {
  
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

  # load raster stack from data directory
  stack <- stack("R/outputData/aoi.tif")
  names(stack) <- desiredBands

  # load raster stack from data directory
  model <- readRDS(modelPath)

  # proj string for reprojection
  proj4 <- '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
  
  # prediction
  prediction <- predict(stack,model)

  # write prediction raster to tif in file directory
  writeRaster(prediction, "R/stack/prediction.tif", overwrite = TRUE)
  
  # parallelization
  cl <- makeCluster(4)
  registerDoParallel(cl)

  # calculate AOA
  AOA <- aoa(stack,model,cl=cl)

  # write prediction raster to tif in file directory
  writeRaster(AOA$AOA, "R/stack/aoa.tif", overwrite=TRUE)
  
  # Calculate a MultiPolygon from the AOA, which can be seen as the area where the user needs to find further training data
  x <- AOA$AOA@data@values
  furtherTrainAreas <- rasterToPolygons(AOA$AOA, fun = function(x) {x == 0}, dissolve = TRUE)
  furtherTrainAreas <- spTransform(furtherTrainAreas, CRS("+init=epsg:4326"))
  
  furtherTrainAreas <- spsample(furtherTrainAreas, n = 30, type = "random")
  
  # Saves the calculated AOnA to a GeoJSON-file
  furtherTrainAreasGeoJSON <- as.geojson(furtherTrainAreas)
  geo_write(furtherTrainAreasGeoJSON, "R/trainAreas/furtherTrainAreas.geojson")

  # save all classes of prediction to json file for web usage
  vector <- c()
  for(class in model$finalModel$classes) {
    vector <- c(vector, class)
  }
  json <- rjson::toJSON(vector)
  write(json, "R/stack/classes.json")

  print('success')
}

