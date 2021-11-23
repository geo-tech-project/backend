library(sf)
getwd()
setwd("Geosoftware 2/R")

library(tmap)
tmap_mode("view")
koeln_shape = read_sf("trainingsdaten_koeln_25832.gpkg")
tmap_options(check.and.fix = TRUE)
tm_shape(st_geometry(koeln_shape)) +  tm_polygons()
st_crs(koeln_shape)

library(mapview)
mapview(koeln_shape)

# BBOX from shape
bbox = st_bbox(koeln_shape) 
bbox

# Transform BBOX TO WGS84
st_as_sfc(bbox) |>
  st_transform("EPSG:4326") |>
  st_bbox() -> bbox_wgs84
bbox_wgs84


# BBOX
xmin <- 7.621872425079345
xmax <- 7.627859115600586
ymin <- 51.960346153985355
ymax <- 51.96336075101087

# Querying images with rstac
library(rstac)
s = stac("https://earth-search.aws.element84.com/v0")

items = s |>
  stac_search(collections = "sentinel-s2-l2a-cogs",
              bbox = c(bbox_wgs84["xmin"],bbox_wgs84["ymin"],
                       bbox_wgs84["xmax"],bbox_wgs84["ymax"]), 
              datetime = "2021-06-01/2021-06-30",
              limit = 500) |>
  post_request() 
items


# Creating an image collection
library(gdalcubes)
assets = c("B01","B02","B03","B04","B05","B06", "B07","B08","B8A","B09","B11","SCL")
s2_collection = stac_image_collection(items$features, asset_names = assets, property_filter = function(x) {x[["eo:cloud_cover"]] < 10})
s2_collection

# Defining the data cube geometry
v.bbox.overview = cube_view(srs="EPSG:25832",  dx=20, dy=20, dt="P30D", 
                         aggregation="median", resampling = "average",
                         extent=list(t0 = "2021-06-01", t1 = "2021-06-30",
                                     left=bbox["xmin"] - 100, right=bbox["xmax"] + 100,
                                     top=bbox["ymax"] + 100, bottom=bbox["ymin"] - 100))
v.bbox.overview

gdalcubes_options(threads = 16)

S2.mask = image_mask("SCL", values = c(3,8,9))
sentinel<- raster_cube(s2_collection, v.bbox.overview, S2.mask) |>
    select_bands(c("B02", "B03", "B04")) |>
    plot(rgb = 3:1, zlim=c(0,1500))
