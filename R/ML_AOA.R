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


training <- function(algorithm, trees) {

  # load packages
  library(raster)
  library(caret)
  library(CAST)
  library(lattice)
  library(sf)
  library(Orcs)
  
  # load raster stack from data directory
  sen_ms <- stack("data/Sen_Muenster.grd")
  
  # load training data
  trainSites <- read_sf("data/trainingsites_muenster.gpkg")
  #trainSites <- read_sf(data)
  
  # Ergänze PolygonID-Spalte falls nicht schon vorhanden, um später mit extrahierten Pixeln zu mergen
  trainSites$PolygonID <- 1:nrow(trainSites)
  
  # Extrahiere Pixel aus den Stack, die vollständig vom Polygon abgedeckt werden
  extr_pixel <- extract(sen_ms, trainSites, df=TRUE)
  
  # Merge extrahierte Pixel mit den zusätzlichen Informationen aus den 
  extr <- merge(extr_pixel, trainSites, by.x="ID", by.y="PolygonID")
  
  # 50% der Pixel eines jeden Polygons für das Modeltraining extrahieren
  set.seed(100)
  trainids <- createDataPartition(extr$ID,list=FALSE,p=0.05)
  trainDat <- extr[trainids,]
  
  # Prädiktoren und Response festlegen
  predictors <- names(sen_ms)
  response <- "Label"
  
  # Drei Folds für die Spatial-Cross-Validation im Modell Training definieren und traincontrol festlegen
  indices <- CreateSpacetimeFolds(trainDat,spacevar = "ID",k=3,class="Label")
  ctrl <- trainControl(method="cv", 
                       index = indices$index,
                       savePredictions = TRUE)
  
  #Erstellen (Training) des Models
  set.seed(100)
  model <- train(trainDat[,predictors],
                 trainDat[,response],
                 method=algorithm,
                 metric="Kappa",
                 trControl=ctrl,
                 importance=TRUE,
                 ntree=trees)
  
  saveRDS(model, file="./tempModel/model.RDS")
  
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


classifyAndAOA <- function(data) {
  
  # load packages
  library(raster) 
  library(leafletR)
  library(CAST) 
  library(tmap)
  library(latticeExtra)
  library(doParallel)
  library(parallel)
  library(Orcs)
  
  # load raster stack from data directory
  sen_ms <- stack("data/Sen_Muenster.grd")

  # load raster stack from data directory
  model <- readRDS("tempModel/model.RDS")
  
  # prediction
  prediction <- predict(sen_ms,model)

  # write prediction raster to tif in file directory
  writeRaster(prediction, "stack/prediction.tif", overwrite = TRUE)
  
  # parallelization
  cl <- makeCluster(4)
  registerDoParallel(cl)

  # calculate AOA
  AOA <- aoa(sen_ms,model,cl=cl)

  # write prediction raster to tif in file directory
  writeRaster(AOA, "stack/aoa.tif", overwrite=TRUE)
 
  # print variable
  data
  
  # Calculate a MultiPolygon from the AOA, which can be seen as the area where the user needs to find further training data
  x <- AOA$AOA@data@values
  furtherTrainAreas <- rasterToPolygons(AOA$AOA, fun = function(x) {x == 0}, dissolve = TRUE)
  
  # Saves the calculated AOnA to a GeoJSON-file
  toGeoJSON(furtherTrainAreas, "furtherTrainAreas", dest = "./trainAreas", lat.lon, overwrite=TRUE)

}

