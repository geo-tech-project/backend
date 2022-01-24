test <- function(data) {
    # load packages
    library(raster)
    library(caret)
    library(CAST)
    library(lattice)
    library(sf)
    library(Orcs)
    library(jsonlite)

    # load raster stack from data directory
    stack <- stack("R/processed_sentinel_images/trainingData.tif")
    desiredBands <- names(stack)
    # names(stack) <- desiredBands



    print("success")
}