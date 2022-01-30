convertGeoPackageToGeoJson <- function(filename, filepath) {
    # setwd(filepath)

    library(sf)
    library(geojson)
    library(geojsonsf)


    trainData_sf <- read_sf(paste(filepath, paste(filename, ".gpkg", sep=""), sep=""))
    trainData_sf_4326 <- st_transform(trainData_sf, crs = st_crs("EPSG:4326"))
    trainData_geojson <- sf_geojson(trainData_sf_4326)

    geo_write(trainData_geojson, paste(filepath, paste(filename, ".geojson", sep=""), sep=""))

    return("Successfully converted the training data from GeoPackage to GeoJSON")
}
    