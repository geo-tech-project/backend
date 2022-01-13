checkTrainingData <- function(path) {
 library(sf)
 trainingData <- read_sf(path)
  
 
 #Checking the geometry
 geometry <- trainingData$geom
 if(is.null(geometry)){
   geometry <- trainingData$geometry
 }
 if(class(geometry)[1] != "sfc_POLYGON"){
   #Fehlercode 3: Geometry hat nicht den Typ Polygon
   return(3)
 }
 
 
 
 #Checking the Label
 labels <- trainingData$Label
 if(is.null(labels)){
   # Fehlercode 1: Datei enthaelt keine Label Spalte
   return(1)
 }
 has_NA <- any(is.na(labels))
 if(has_NA){
   # Fehlercode 2: Datei enthaelt teilweise keine Label Werte
   return(2)
 }
 return(0) # Trainingsdaten sind valide
}

# geopackage <- checkTrainingData("./training_data/trainingsdaten_koeln_4326.gpkg") # Erwarte 0
# geopackage_2 <- checkTrainingData("./training_data/trainingsdaten_berlin_4326.gpkg") # Erwarte 2
# geopackage_3 <- checkTrainingData("./training_data/trainingsdaten_berlin_2_4326.gpkg") # Erwarte 3
# geojson <- checkTrainingData("./training_data/trainingsdaten_muenster_4326.geojson") # Erwarte 2
# geojson_2 <- checkTrainingData("./training_data/trainingsdaten_muenster_2_4326.geojson") # Erwarte 1
# geojson_3 <- checkTrainingData("./training_data/trainingsdaten_muenster_3_4326.geojson") # Erwarte 3
