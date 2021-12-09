rundemo <- function(data) {
    library(raster)
    library(caret)
    library(CAST)
    library(lattice)
    library(sf)
    library(Orcs)
    library(jsonlite)
    library(leafletR)
    library(tmap)
    library(latticeExtra)
    library(doParallel)
    library(parallel)


    # load raster stack from data directory
    sen_ms <- stack("R/data/Sen_Muenster.grd")
    
    # load training data
    trainSites <- read_sf("R/data/trainingsites_muenster.gpkg")
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
                    method="rf",
                    metric="Kappa",
                    trControl=ctrl,
                    importance=TRUE,
                    ntree=75)
    
    # prediction
    prediction <- predict(sen_ms,model)

    # write prediction raster to tif in file directory
    writeRaster(prediction, "R/stack/prediction.tif", overwrite = TRUE)
    
    # parallelization
    cl <- makeCluster(4)
    registerDoParallel(cl)

    # calculate AOA
    AOA <- aoa(sen_ms,model,cl=cl)

    # write prediction raster to tif in file directory
    #writeRaster(AOA, "R/stack/aoa.tif", overwrite=TRUE)
    AOA_polygonized <- rasterToPolygons(AOA$AOA, dissolve = TRUE)
    toGeoJSON(AOA_polygonized, "AOA_GeoJson", dest = "R/stack", lat.lon, overwrite=TRUE)
    
    # print variable
    data
    
    # Calculate a MultiPolygon from the AOA, which can be seen as the area where the user needs to find further training data
    x <- AOA$AOA@data@values
    furtherTrainAreas <- rasterToPolygons(AOA$AOA, fun = function(x) {x == 0}, dissolve = TRUE)
    
    # Saves the calculated AOnA to a GeoJSON-file
    toGeoJSON(furtherTrainAreas, "furtherTrainAreas", dest = "R/trainAreas", lat.lon, overwrite=TRUE)

    print('success')
}