setwd("~/Documents/Studium/5. Semester/Geosoftware_II/geo-tech-project/backend/public/uploads/")

convertGeoPackageToGeoJson <- function(filename) {
    library(sf)
    library(geojson)
    library(geojsonsf)

    trainData_sf <- read_sf(paste(filename, ".gpkg", sep=""))
    trainData_sf_4326 <- st_transform(trainData_sf, crs = st_crs("EPSG:4326"))
    trainData_geojson <- sf_geojson(trainData_sf_4326)

    geo_write(trainData_geojson, paste(filename, ".geojson", sep=""))

    "Successfully converted the training data from GeoPackage to GeoJSON"
}
    