library(sf)
getwd()

#Set working directory to source file location
getwd()
#setwd("C:/Users/thali/OneDrive/Dokumente/WWU/6. Semester/Geosoftware 1/GitHub/backend")

library(tmap)
tmap_mode("view")
koeln_shape = read_sf("trainingsdaten_koeln_25832.gpkg")
tmap_options(check.and.fix = TRUE)
tm_shape(st_geometry(koeln_shape)) +  tm_polygons()
#st_crs(koeln_shape)
#nl_shape = read_sf("NL.gpkg")
#nl_shape$geom
#koeln_shape$geom
#koeln_shape_simple <- st_simplify(koeln_shape)


library(mapview)
#mapview(koeln_shape)

# BBOX from shape
bbox = st_bbox(koeln_shape) 
bbox


# Transform BBOX TO WGS84 (STAC needs WGS84)
st_as_sfc(bbox) |>
  st_transform("EPSG:4326") |>
  st_bbox() -> bbox_wgs84
bbox_wgs84


# BBOX
#xmin <- 7.621872425079345
#xmax <- 7.627859115600586
#ymin <- 51.960346153985355
#ymax <- 51.96336075101087

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
sentinel <- raster_cube(s2_collection, v.bbox.overview, S2.mask)

plot(sentinel)
#sentinel |>
  #select_bands(c("B03", "B04", "B08")) |>
  #filter_geom(koeln_shape_simple$geom) |>
  #plot(rgb = 3:1, zlim=c(0,1500))


write_tif(
  sentinel,
  dir = "C:/Users/thali/OneDrive/Dokumente/WWU/6. Semester/Geosoftware 1/GitHub/backend/R",
  prefix = "test.tif",
  overviews = FALSE,
  COG = TRUE,
  rsmpl_overview = "nearest",
  creation_options = NULL,
  write_json_descr = FALSE,
  pack = NULL
)
.
?write_tif

library(raster)
sentinel_stack <- stack("test.tif")
names(sentinel_stack) <- c("B01", "B02", "B03", "B04",
                           "B05", "B06", "B07", "B08",
                           "B09", "B11", "B8A", "SCL")
plot(sentinel_stack)
writeRaster(sentinel_stack,"predictors_koeln.grd")

sentinel_stack <- stack("predictors_koeln.grd")


?st_read()
sentinel_stack_grd <- st_read("test.tif")
crs(sentinel_stack)

sentinel_stack

sentinel_B01 <- sentinel_stack$B01

crs(sentinel_B01)
sentinel_B01_WGS84 <- st_transform(sentinel_stack,crs= "+init=epsg:4236")

?st_transform
sentinel_stack_WGS84 <- st_transform(sentinel_stack,crs= "+init=epsg:4236")
sentinel_stack_WGS84 <- st_transform(sentinel_stack,crs= "+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs")

sentinel_stack_WGS84 <-projectRaster(test,crs= proj)

sentinel_stack_WGS84
crs(sentinel)
mapview(sentinel_stack_WGS84)

test <- raster("test.tif")
crs(test)
plot(test)
test_WGS84 <- projectRaster(test,crs= proj )
?projectRaster
crs(test_WGS84)
proj <- "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs "
