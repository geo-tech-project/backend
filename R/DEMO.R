rundemo <- function(data) {
  library(raster)
  library(caret)
  library(CAST)
  library(lattice)
  library(sf)
  library(Orcs)
  library(tmap)
  library(latticeExtra)
  library(doParallel)
  library(parallel)
  library(rgeos)
  library(geojson)
  library(rjson)
  library(sp)

  # load raster stack from data directory
  sen_ms <- stack("R/data/Sen_Muenster.grd")

  # load training data
  trainSites <- read_sf("R/data/trainingsites_muenster.gpkg")

  # Ergänze PolygonID-Spalte falls nicht schon vorhanden, um später mit extrahierten Pixeln zu mergen
  trainSites$PolygonID <- 1:nrow(trainSites)

  # Extrahiere Pixel aus den Stack, die vollständig vom Polygon abgedeckt werden
  extr_pixel <- extract(sen_ms, trainSites, df = TRUE)

  # Merge extrahierte Pixel mit den zusätzlichen Informationen aus den
  extr <- merge(extr_pixel, trainSites, by.x = "ID", by.y = "PolygonID")

  # 50% der Pixel eines jeden Polygons für das Modeltraining extrahieren
  set.seed(100)
  trainids <- createDataPartition(extr$ID, list = FALSE, p = 0.05)
  trainDat <- extr[trainids, ]

  # Prädiktoren und Response festlegen
  predictors <- names(sen_ms)
  response <- "Label"

  # Drei Folds für die Spatial-Cross-Validation im Modell Training definieren und traincontrol festlegen
  indices <- CreateSpacetimeFolds(trainDat, spacevar = "ID", k = 3, class = "Label")
  ctrl <- trainControl(
    method = "cv",
    index = indices$index,
    savePredictions = TRUE
  )

  # Erstellen (Training) des Models
  set.seed(100)
  model <- train(trainDat[, predictors],
    trainDat[, response],
    method = "rf",
    metric = "Kappa",
    trControl = ctrl,
    importance = TRUE,
    ntree = 75
  )

  # prediction
  prediction <- predict(sen_ms, model)

  # Remove all files from folder
  unlink("./R/demo_output/*")

  # write prediction raster to tif in file directory
  writeRaster(prediction, "R/demo_output/prediction.tif", overwrite = TRUE)

  # Delete xml-File
  unlink("R/demo_output/prediction.tif.aux.xml")

  # parallelization
  cl <- makeCluster(4)
  registerDoParallel(cl)

  # calculate AOA
  AOA <- aoa(sen_ms, model, cl = cl)

  # write prediction raster to tif in file directory
  writeRaster(AOA$AOA, "R/demo_output/aoa.tif", overwrite = TRUE)


  # Calculate a Polygon from the AOA
  x <- AOA$AOA@data@values
  furtherTrainAreas <- rasterToPolygons(AOA$AOA, fun = function(x) {
    x == 0
  }, dissolve = TRUE)

  # Transform coordinate system of further train areas
  furtherTrainAreas <- spTransform(furtherTrainAreas, CRS("+init=epsg:4326"))

  # Create 30 random points as suggested further training areas
  furtherTrainAreas <- spsample(furtherTrainAreas, n = 30, type = "random")

  # Saves the suggested points as GeoJson
  furtherTrainAreasGeoJSON <- as.geojson(furtherTrainAreas)
  geo_write(furtherTrainAreasGeoJSON, "R/demo_output/furtherTrainAreas.geojson")


  print("Calculation of the demo was successfully")
}