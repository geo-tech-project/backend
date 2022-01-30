test <- function(x) {
    library(testthat)
    source("./../R/ConvertGeoPackageToGeoJson.R")

    out0 <- convertGeoPackageToGeoJson("trainingsdaten_koeln_4326", "./../R/training_data/")
    test_that("trainingsdaten_koeln_4326.gpkg successfully", {
        expect_equal(out0, "Successfully converted the training data from GeoPackage to GeoJSON")
    })

    out1 <- convertGeoPackageToGeoJson("trainingsdaten_koeln_25832", "./../R/training_data/")
    test_that("trainingsdaten_koeln_4326.gpkg successfully", {
        expect_equal(out0, "Successfully converted the training data from GeoPackage to GeoJSON")
    })

    out2 <- convertGeoPackageToGeoJson("trainingsdaten_muenster_32632", "./../R/training_data/")
    test_that("trainingsdaten_koeln_4326.gpkg successfully", {
        expect_equal(out0, "Successfully converted the training data from GeoPackage to GeoJSON")
    })

    out3 <- convertGeoPackageToGeoJson("trainingsdaten_suedgeorgien_4326", "./../R/training_data/")
    test_that("trainingsdaten_koeln_4326.gpkg successfully", {
        expect_equal(out0, "Successfully converted the training data from GeoPackage to GeoJSON")
    })

    out4 <- convertGeoPackageToGeoJson("trainingsdaten_berlin_4326", "./../R/training_data/")
    test_that("trainingsdaten_koeln_4326.gpkg successfully", {
        expect_equal(out0, "Successfully converted the training data from GeoPackage to GeoJSON")
    })
}