
/**
 * @constant {module} R  R package to execute R Files, commands and methods
 */
const R = require('r-integration');

/**
 * @constant {String} rFilePath Path to the R File where the functions are stored
 */
const rFilePath = './R/ML_AOA.R';

/**
 * The function calls the classifyAndAOA function of the ML_AOA-R-script. It passes the path of the model
 * to be used for the calculations and the desired bands which the AOI-stack bands should be named like.
 * The function returns the output variable in which the reponse of the asyncronous call is stored.
 * The response is either a String which confirms the successfull calculations or an error.
 * 
 * @async 
 * @param {String} modelPath The relative path to the location of the model which the user provided.
 * @param {String[]} desiredBands Telling the R-Skript how to name the bands of the used aoi.tif. Each Band must be a standalone String in
 * the Array. Required is the 'SCL' which was used for filtering the clouds before.
 * @returns the result of the R-Skript. Either error object or String that confirms the successfull calculations.
 */
async function calculateAOAwithGivenModel(modelPath, desiredBands) {

    let output = {};
    output.training = ["3"]
    try {
        output.classifyAndAOA = await R.callMethodAsync(rFilePath, "classifyAndAOA", { modelPath: modelPath, desiredBands: desiredBands })
    } catch (error) {
        output.classifyAndAOA = ["2"]
    }
    return output;
}

/**
 * The function calls the training function of the ML_AOA-R-script. It passes the algorithm (desired by the user), 
 * the trainingdataPath (relative filepath where the uploaded training data can be found), the hyperparameter (defined by the user)
 * and the desiredBands (to name the aoi.tif bands). The function returns an output object in which the responses of the async calls
 * are stored. If an unexpected error occurs the output variable is set to a specific value.
 * 
 * @async
 * @param {String} algorithm Abreviation of the method in caret package to tell the Skript the how to train.
 * @param {String} trainingDataPath The relative path to the location of the training data which the user provided.
 * @param {Numbers[]} hyperparameter Hyperparameter selected by the user or default values
 * @param {Array} desiredBands Telling the R-Skript how to name the bands of the used trainingData.tif and aoi.tif. Each Band must be a standalone String in
 * the Array. Required is the 'SCL' which was used for filtering the clouds before.
 * @returns 
 */
async function calculateNewModelAndAOA(algorithm, trainingDataPath, hyperparameter, desiredBands) {

    let output = {}

    try {
        output.training = await R.callMethodAsync(rFilePath, "training", { algorithm: algorithm, trainingDataPath: trainingDataPath, hyperparameter: hyperparameter, desiredBands: desiredBands })
    } catch (error) {
        output.training = ["2"]
        output.classifyAndAOA = ["3"]
        return output;
    }

    try {
        output.classifyAndAOA = await R.callMethodAsync(rFilePath, "classifyAndAOA", { modelPath: "R/model/model.RDS", desiredBands: desiredBands })
    } catch (error) {
        output.classifyAndAOA = ["2"]
    }

    console.log("output: ", output)

    return output;
}


/**
 * This function will process the incoming data in the format which is needed by the R function. If the request of the user is based on
 * an uploaded model, only three parameters (option, filePath, desiredBands) are needed. If it is based on training data,
 * five parameters (option, filePath, desiredBands, algorithm, trainingData) are necessary.  
 * @param {{
 *          whereareyoufrom: String,
 *          topleftlat: Number,
 *          topleftlng: Number,
 *          bottomleftlat: Number,
 *          bottomleftlng: Number,
 *          bottomrightlat: Number,
 *          bottomrightlng: Number,
 *          toprightlat: Number,
 *          toprightlng: Number,
 *          option: String,
 *          algorithm: String,
 *          startDate: Date-String,
 *          endDate: Date-String;
 *          filename: String,
 *          resolution: String,
 *          channels: String[],
 *          coverage: Number,
 *          mtry: String
 * }} data The data which must be provided by the POST request, to start the R function. 
 * @returns The processed data as an object.
 */
function processInputData(data) {
    var out = {
        option: data.option,
        filePath: './public/uploads/' + data.filename,
        desiredBands: data.channels
    }
    if (data.option == 'data') {
        if (data.algorithm == "rf") {
            out.algorithm = "rf";
            out.hyperparameter = [data.mtry]
        } else if (data.algorithm == "svmRadial") {
            out.algorithm = "svmRadial"
            out.hyperparameter = [data.sigma, data.cost]
        }
    }
    return out;
}



/**
 * The function gets the metadata from the users request and processes it first for its further calculations. Onwards either the function for calculating
 * the prediction and aoa  with a given model is called or the function which first calculates a model based on provided training data and afterwards calculates
 * the prediction and aoa is called.
 * @async
 * @param {{
 *          whereareyoufrom: String,
 *          topleftlat: Number,
 *          topleftlng: Number,
 *          bottomleftlat: Number,
 *          bottomleftlng: Number,
 *          bottomrightlat: Number,
 *          bottomrightlng: Number,
 *          toprightlat: Number,
 *          toprightlng: Number,
 *          option: String,
 *          algorithm: String,
 *          startDate: Date-String,
 *          endDate: Date-String;
 *          filename: String,
 *          resolution: String,
 *          channels: String[],
 *          coverage: Number,
 *          mtry: String
 * }} request All the data which will be provided from the front end. 
 * @returns The output which is generated by getTraingDataTif
 */
async function calculateAOA(data) {

    let processedData = processInputData(data);
    let output = {}
    if (processedData.option == 'data') {

        output = await calculateNewModelAndAOA(processedData.algorithm, processedData.filePath, processedData.hyperparameter, processedData.desiredBands)

        if (output.training[0] === "0" && output.classifyAndAOA[0] === '0') {
            output.training = {
                status: 'ok',
                data: 'Model training: successfull'
            }
            output.classifyAndAOA = {
                status: 'ok',
                data: 'Prediction and AOA: successfull'
            }
            console.log("model.RDS was successfully created")
            console.log("prediction.tif was successfully created")
            console.log("aoa.tif was successfully created")
        } else if (output.training[0] === '2' && output.classifyAndAOA[0] === '3') {
            output.training = {
                status: 'error',
                error: 'Model training: Unexpected error occured',
                errorDetails: output.training[0]
            }
            output.classifyAndAOA = {
                status: 'not executed',
                error: 'Prediction and AOA: Not executed due to unexpected error in model training',
                errorDetails: output.classifyAndAOA[0]
            }
            console.log("Model training: Unexpected error occured")
        } else if (output.training[0] === '0' && output.classifyAndAOA[0] === '2') {
            output.training = {
                status: 'ok',
                data: 'Model training: successfull'
            }
            output.classifyAndAOA = {
                status: 'error',
                error: 'Prediction and AOA: Unexpected error occured',
                errorDetails: output.classify[0]
            }
            console.log("Prediction and AOA: Unexpected error occured")
        }
        //Setting output.status to 'ok' if the script(s) run successfully, otherwise 'error'.
        if (output.training.status === 'ok' && output.classifyAndAOA.status === 'ok') {
            output.status = 'ok'
        } else {
            output.status = 'error'
        }

    } else if (processedData.option == 'model') {

        output = await calculateAOAwithGivenModel(processedData.filePath, processedData.desiredBands)

        if (output.training[0] === '3' && output.classifyAndAOA[0] === '0') {
            output.training = {
                status: 'not executed',
                error: 'Model training: Not executed due to calculation with uploaded model',
                errorDetails: output.classifyAndAOA[0]
            }
            output.classifyAndAOA = {
                status: 'ok',
                data: 'Prediction and AOA: successfull'
            }
            console.log("prediction.tif was successfully created")
            console.log("aoa.tif was successfully created")
        } else if (output.training[0] === '3' && output.classifyAndAOA[0] === '1') {
            output.training = {
                status: 'not executed',
                error: 'Model training: Not executed due to calculation with uploaded model',
                errorDetails: output.classifyAndAOA[0]
            }
            output.classifyAndAOA = {
                status: 'error',
                error: 'Prediction and AOA: There are predictors in the uploaded model which are are missing in the Sentinel data',
                errorDetails: output.classifyAndAOA[0]
            }
            console.log("Prediction and AOA: There are predictors in the uploaded model which are are missing in the Sentinel data")
        } else if (output.training[0] === '3' && output.classifyAndAOA[0] === '2') {
            output.training = {
                status: 'not executed',
                error: 'Model training: Not executed due to calculation with uploaded model',
                errorDetails: output.classifyAndAOA[0]
            }
            output.classifyAndAOA = {
                status: 'error',
                error: 'Prediction and AOA: Unexpected error occured',
                errorDetails: output.classifyAndAOA[0]
            }
            console.log("Prediction and AOA: Unexpected error occured")
        }

        //Setting output.status to 'ok' if the script(s) run successfully, otherwise 'error'.
        if (output.classifyAndAOA.status === 'ok') {
            output.status = 'ok'
        } else {
            output.status = 'error'
        }

    }
    return output;
}

/** error-codes
 * 0: ok
 * 1: predictor of model not in the given sentinel tif (only relevant if working with user model)
 * 2: unexpected error
 * 3: not executed
 */



module.exports = {
    calculateAOA, calculateAOAwithGivenModel, calculateNewModelAndAOA, processInputData
};