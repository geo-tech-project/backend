
test <- function(x) {
  library(testthat)
  source("./../R/Check_TrainingData.R")

  out0 <- checkTrainingData("./../R/training_data/trainingsdaten_koeln_4326.gpkg")
  test_that("trainingsdaten_koeln_4326.gpkg is valid", {
    expect_equal(out0, 0)
  })

  out1 <- checkTrainingData("./../R/training_data/trainingsdaten_berlin_4326.gpkg")
  test_that("trainingsdaten_berlin_4326.gpkg has at some Polygons no Labels", {
    expect_equal(out1, 2)
  })

  out2 <- checkTrainingData("./../R/training_data/trainingsdaten_berlin_2_4326.gpkg")
  test_that("trainingsdaten_berlin_2_4326.gpkg has not the type sfc_POLYGON", {
    expect_equal(out2, 3)
  })

  out3 <- checkTrainingData("./../R/training_data/trainingsdaten_muenster_4326.geojson")
  test_that("trainingsdaten_muenster_4326.geojson has at some Polygons no Labels", {
    expect_equal(out3, 2)
  })

  out4 <- checkTrainingData("./../R/training_data/trainingsdaten_muenster_2_4326.geojson")
  test_that("trainingsdaten_muenster_2_4326.geojson has no properties with Label", {
    expect_equal(out4, 1)
  })

  out5 <- checkTrainingData("./../R/training_data/trainingsdaten_muenster_3_4326.geojson")
  test_that("trainingsdaten_muenster_3_4326.geojson has not the type sfc_POLYGON", {
    expect_equal(out5, 3)
  })
}