
GetSatelliteImages_dependencies <- c("sf","rgdal","rgeos","rstac","gdalcubes","raster")

#Itereate over the list of dependencies and install them
for (dependencies in GetSatelliteImages_dependencies) {
    #if dependency is not installed.packages() install it
    if (!(dependencies %in% installed.packages())) {
        install.packages(dependencies, repos="http://cran.us.r-project.org")
    }
    
}

ML_AOA_dependencies <- c("raster","caret","CAST","lattice","sf","Orcs","jsonlite","tmap","latticeExtra","doParallel","parallel","Orcs","sp","rgeos","geojson","rjson","randomForest")

for(dependencies in ML_AOA_dependencies) {
    if (!(dependencies %in% installed.packages())) {
        install.packages(dependencies, repos="http://cran.us.r-project.org")
    }
}

