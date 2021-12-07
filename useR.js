//Hard coded parameters, saved seperately for easy modification.

/**
 * Hard coded parameter with desiredBands.
 */
const DESIRED_BANDS = ["B02", "B03", "B04", "SCL"];

/**
 * Hard coded parameter for limit of stac request.
 */
const LIMIT = 100;

/**
 * Hard coded parameter for resolution of packages.
 */
const RESOLUTION = 400;

/**
 * Hard coded parameter for the cloud coverage in percentage.
 */
const CLOUD_COVERAGE_IN_PERCENTAGE = 20;
/**
 * R package to execute R Files, commands and methods
 */
const R = require('r-integration');

/**
 * Path to the R File where the functions are stored
 */
const rFilePath = './R/GetSatelliteImages.R';





/**
 * These function make the call of the function to get the Tif for the given Training data. These function will also try and catch these 
 * R function, to catch all the errors that could maybe occur. If the R function run successsfully these function will return the output, if not
 * it will return an error object.  
 * @param {String} trainingDataPath The relative path to the location of the trainingData. The Training Data can be formatted as Geopackage or
 * GeoJSON. Will be passed to R.
 * @param {String} datetime The start and end Date. Must be formatted as RFC3339 String. Start date must be lower than end date. Format is: 
 * 'YYYY-MM-DD/YYYY-MM-DD. Will be passed to R.  
 * @param {Number} limit The limit of returned features from the STAC request, can be specified with the limit parameter. For example if limit
 * is 100, the max number of returned features is 100. Will be passed to R.
 * @param {String[]} desiredBands Telling R-STAC which bands from the Sentinel data will be selected. Each Band must be a standalone String in
 * the Array. Required is the 'SCL' band for filtering the clouds from the data. Will be passed to R. 
 * @param {Number} resolution The resolution says how big one pixel is. For example if resolution is 20. One Pixel will have the size 20x20.
 * The unit of ressolution is metres. Will be passed to R.
 * @param {Number} cloudCoverageInPercentage These parameter define, which found features will be sorted off, based on their cloud Coverage.
 * For example if cloudCoverageInPercentage is 20, than all Features with an overall cloudCoverage greater than 20 will be sorted of. Will be
 * passed to R.
 * @returns The result of the R script, if the script worked successfully, if not it will return a error object, containing an error message and 
 * the actual error which is thrown by R.
 */
async function getTrainingDataTif(trainingDataPath, datetime, limit, desiredBands, resolution, cloudCoverageInPercentage) {

    //Formatting input in style of R code.
    let parameters = {
        trainingDataPath: trainingDataPath,
        datetime: datetime,
        limit: limit,
        desiredBands: desiredBands,
        resolution: resolution,
        cloudCoverageInPercentage: cloudCoverageInPercentage
    }
    let output;
    //try to execute R code
    try {
        output = await R.callMethodAsync(rFilePath, "generateSatelliteImageFromTrainingData", parameters);
    } catch (error) {
        //Build an error object.
        //TODO: More specific error msg from R given to the error object.
        output = {
            msg: "Error in R Script.",
            error: error
        }
    }
    return output;
}

/**
 * These function make the call of the function to get the Tif for the given AOI data. These function will also try and catch these 
 * R function, to catch all the errors that could maybe occur. If the R function run successsfully these function will return the output, if not
 * it will return an error object.
 * @param {Number} bottomLeftX The Number of the longitude coordinate of the bottom left corner of the AOI. Must be given in WGS84. Will 
 * be passed to R. 
 * @param {Number} bottomLeftY The Number of the latitude coordinate of the bottom left corner of the AOI. Must be given in WGS84. Will 
 * be passed to R. 
 * @param {Number} topRightX The Number of the longitude coordinate of the top right corner of the AOI. Must be given in WGS84. Will 
 * be passed to R.
 * @param {Number} topRightY  The Number of the latitude coordinate of the top right corner of the AOI. Must be given in WGS84. Will 
 * be passed to R.
 * @param {String} datetime The start and end Date. Must be formatted as RFC3339 String. Start date must be lower than end date. Format is: 
 * 'YYYY-MM-DD/YYYY-MM-DD. Will be passed to R.  
 * @param {Number} limit The limit of returned features from the STAC request, can be specified with the limit parameter. For example if limit
 * is 100, the max number of returned features is 100. Will be passed to R.
 * @param {String[]} desiredBands Telling R-STAC which bands from the Sentinel data will be selected. Each Band must be a standalone String in
 * the Array. Required is the 'SCL' band for filtering the clouds from the data. Will be passed to R. 
 * @param {Number} resolution The resolution says how big one pixel is. For example if resolution is 20. One Pixel will have the size 20x20.
 * The unit of ressolution is metres. Will be passed to R.
 * @param {Number} cloudCoverageInPercentage These parameter define, which found features will be sorted off, based on their cloud Coverage.
 * For example if cloudCoverageInPercentage is 20, than all Features with an overall cloudCoverage greater than 20 will be sorted of. Will be
 * passed to R.
 * @returns The result of the R script, if the script worked successfully, if not it will return a error object, containing an error message and 
 * the actual error which is thrown by R.
 */
async function getAoiTif(bottomLeftX, bottomLeftY, topRightX, topRightY, datetime, limit, desiredBands, resolution, cloudCoverageInPercentage) {

    let parameters = {
        bottomLeftX: bottomLeftX,
        bottomLeftY: bottomLeftY,
        topRightX: topRightX,
        topRightY: topRightY,
        datetime: datetime,
        limit: limit,
        desiredBands: desiredBands,
        resolution: resolution,
        cloudCoverageInPercentage: cloudCoverageInPercentage
    }

    let output;
    try {
        output = await R.callMethodAsync(rFilePath, 'generateSatelliteImageFromAOI', parameters);
    } catch (error) {
        output = {
            msg: "An Error in the R Script occured",
            error: error
        }
    }
    return output;
}
/**
 * This function will process the incoming data in the format which is needed by the R function. For example putting startDate and EndDate in
 * a single datetime. In the moment some data which can not be specified in the Front End, are hardcoded here.  
 * @param {{
 *          bottomLeftlng: Number,
 *          bottomLeftlat: Number,
 *          toprightlng: Number,
 *          toprightlat: Number,
 *          trainingDataPath: String,
 *          option: Boolean,
 *          startDate: Date,
 *          endDate: Date
 * }} data The data which must be provided by the POST request, to start the R function. 
 * @returns The processed data as an object.
 */
function processInputData(data) {
    var out = {
        bottomLeftX: data.bottomleftlng,
        bottomLeftY: data.bottomleftlat,
        topRightX: data.toprightlng,
        topRightY: data.toprightlat,
        haveTrainingData: false,
        trainingDataPath: '',
        datetime: '',
        desiredBands: data.channels.push('SCL'),
        limit: LIMIT,
        resolution: parseInt(data.resolution),
        cloudCoverageInPercentage: data.coverage
    }
    if (data.option == "data") {
        out.haveTrainingData = true;
    } else {
        out.haveTrainingData = false;
    }
    out.datetime = data.startDate.substring(0, 10) + '/' + data.endDate.substring(0, 10);
    let path = './R/Trainingsdaten/'
    out.trainingDataPath = path + data.filename;
    return out;
}

/**
 * The functions processInoutData and getTraingDataTif where combinded here to a single function, which can be called from app.js if its
 * get data for starting a calculation.  
 * @param {{
 *          bottomLeftlng: Number,
 *          bottomLeftlat: Number,
 *          toprightlng: Number,
 *          toprightlat: Number,
 *          trainingDataPath: String,
 *          option: Boolean,
 *          startDate: Date,
 *          endDate: Date
 * }} request All the data which will be provided from the front end. 
 * @returns The output which is generated by getTraingDataTif
 */
async function getData(request) {
    let processedData = processInputData(request);
    let output = {
        aoi: {},
        trainingData: {}
    }
    output.aoi = await getAoiTif(processedData.bottomLeftX, processedData.bottomLeftY, processedData.topRightX, processedData.topRightY, processedData.datetime, processedData.limit, processedData.desiredBands, processedData.resolution, processedData.cloudCoverageInPercentage);
    if (processedData.haveTrainingData) {
        output.trainingData = await getTrainingDataTif(processedData.trainingDataPath, processedData.datetime, processedData.limit, processedData.desiredBands, processedData.resolution, processedData.cloudCoverageInPercentage);
    } else {
        output.trainingData = null;
    }
    return output;
}

module.exports = {
    getData
};