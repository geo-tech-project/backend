
test <- function(x) {
  rm(list = ls())
  source('./../R/GetSatelliteImages.R')

  library(testthat)

  test_that("get UTM Zone works with WGS84 longitudes", {

    long = c(0, -10, 7, 7.105, 85, 84.8, 3)
    utm_zones = c(31, 29, 32, 32, 45, 45, 31)

    for (i in long) {
      expect_equal(getUTMZone(long[i]), utm_zones[i])
    }
  })

  test_that("Function generates EPSG Code from UTM zone correctly", {


    expect_true(epsgCodeFromUTMzone(1) == "EPSG:32601")
    expect_true(epsgCodeFromUTMzone(2) == "EPSG:32602")
    expect_true(epsgCodeFromUTMzone(3) == "EPSG:32603")
    expect_true(epsgCodeFromUTMzone(5) == "EPSG:32605")
    expect_true(epsgCodeFromUTMzone(10) == "EPSG:32610")
    expect_true(epsgCodeFromUTMzone(11) == "EPSG:32611")
    expect_true(epsgCodeFromUTMzone(12) == "EPSG:32612")
    expect_true(epsgCodeFromUTMzone(13) == "EPSG:32613")
    expect_true(epsgCodeFromUTMzone(14) == "EPSG:32614")
    expect_true(epsgCodeFromUTMzone(30) == "EPSG:32630")
    expect_true(epsgCodeFromUTMzone(50) == "EPSG:32650")
    expect_true(epsgCodeFromUTMzone(60) == "EPSG:32660")
    
  })

  test_that("Function generates EPSG code from WGS84 Longitude correctly", {

    expect_true(getEPSG(7.1) == "EPSG:32632")
    expect_true(getEPSG(7.0) == "EPSG:32632")
    expect_true(getEPSG(0) == "EPSG:32631")
    expect_true(getEPSG(-10) == "EPSG:32629")
    expect_true(getEPSG(85) == "EPSG:32645")
  })

  #bbox 1 for testing purposes
  minx = -1
  miny = -1
  maxx = 1
  maxy = 1

  bbox = getBBoxFromAOI(minx, miny, maxx, maxy)

  #bbox 2 for testing purposes
  minx2 = 49.85
  miny2 = 50.1
  maxx2 = 50.03
  maxy2 = 50.11

  bbox2 = getBBoxFromAOI(minx2, miny2, maxx2, maxy2)

  test_that("That the bbox have coordinate Reference system WGS84, if created with getBBoxFromAOI", {

    expect_true(bbox@proj4string@projargs == "+proj=longlat +datum=WGS84 +no_defs")
    expect_true(bbox2@proj4string@projargs == "+proj=longlat +datum=WGS84 +no_defs")
  })

  test_that("That the areas of the bbox is calculated correctly. (So the arguments are set correct)", {
    expect_equal(bbox@polygons[[1]]@area, 4)
    expect_equal(bbox2@polygons[[1]]@area, 0.0018)
  })


  test_that("Number of days from period works", {

    expect_equal(numberOfDaysFromPeriod("2021-01-01/2021-12-31"), 364)
    expect_equal(numberOfDaysFromPeriod("2021-01-01/2021-01-01"), 0)
    expect_equal(numberOfDaysFromPeriod("2021-12-30/2021-12-31"), 1)
    expect_equal(numberOfDaysFromPeriod("2021-01-01/2021-01-31"), 30)
    expect_equal(numberOfDaysFromPeriod("2021-01-31/2021-02-01"), 1)
    expect_equal(numberOfDaysFromPeriod("2020-02-28/2020-03-01"), 2)
    expect_equal(numberOfDaysFromPeriod("2021-12-31/2022-01-02"), 2)

  })

  request1 = stacRequest(bbox2, "2021-01-01/2021-12-31", 500)

  test_that("STAC request has worked", {

    expect_equal(request1[["numberMatched"]], 145)
    expect_equal(length(request1[["features"]]), 145)
  })

  imageCollection1 = createImageCollection(c("B02", "B03", "B04", "SCL"), -1, request1)
  imageCollection2 = createImageCollection(c("B02", "B03", "B04", "SCL"), 20, request1)

  test_that("create image collection returns 3 if all results are filtered because of the cloud coverage", {

    expect_equal(imageCollection1, 3)
  })

  test_that("An image collection is created if images passes the cloud filter", {
    expect_true(class(imageCollection2)[1] == "image_collection")
  })

  cubeView = createCubeView(transformBBOXcrsToUTM(bbox), 100, "2021-01-01/2021-12-31")

  test_that("Cube view is created correctly", {
    expect_equal(cubeView[["time"]][["nt"]], 1)
    expect_equal(cubeView[["space"]][["left"]], 721529.2)
    expect_equal(cubeView[["space"]][["top"]], 111850)

    expect_true(cubeView[["space"]][["srs"]] == "EPSG:32630")
  })
}

foo <- function(x){
  return(x)
}
