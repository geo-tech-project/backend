
//Hard coded parameters, saved seperately for easy modification.


/**
 * R package to execute R Files, commands and methods
 */
 const R = require('r-integration');

 /**
  * Path to the R File where the functions are stored
  */
 const rFilePath = './R/ML_AOA.R';


function calculateAOAwithGivenModel(modelPath, desiredBands) {
    
    let output;
    
    try{
        output = R.callMethodAsync(rFilePath, "classifyAndAOA", {modelPath: modelPath, desiredBands: desiredBands})    
    } catch {
        output = {
            message: "An Error in the R-Script occured", 
            error: error
        }        
    }
    return output;
 }

 
function calculateNewModelAndAOA(algorithm, trainingDataPath, hyperparameter, desiredBands) { //chosen_hyperparameter
    let output = {}
    //console.log(hyperparameter)
    //console.log(algorithm)
     try {
        callMethodAsync(rFilePath, "training", {algorithm: algorithm, trainingDataPath: trainingDataPath, hyperparameter: hyperparameter, desiredBands}).then((result) => {
                output.model = result[0];
                callMethodAsync(rFilePath, "classifyAndAOA", {modelPath: "R/model/model.RDS", desiredBands: desiredBands}).then((result) => {
                    output.classifyAndAOA = result[0];
                }).catch((error) => {
                    console.error(error);
                })
            }).catch((error) => {
                console.log(error)
            })
    } catch(error) {
        output = {
            message: "An Error in the R-Script occured", 
            error: error
        }        
    }
    return output;
 }


 /**
 * This function will process the incoming data in the format which is needed by the R function. For example putting startDate and EndDate in
 * a single datetime. In the moment some data which can not be specified in the Front End, are hardcoded here.  
 * @param {{
  *          option: String,
  *          algorithm: String
  *          trainingDataPath: String,
  * }} data The data which must be provided by the POST request, to start the R function. 
  * @returns The processed data as an object.
  */
function processInputData(data) {
    console.log(data)
    var out = {
        option: data.option,
        filePath: './public/uploads/' + data.filename, 
        desiredBands: data.channels
    }
    if(data.option == 'data') {
        if(data.algorithm = "rf") {
            out.algorithm = "rf";
            out.hyperparameter = [data.mtry]
        } else if (data.algorithm == "svmRadial") {
            out.algorithm ="svmRadial"
            out.hyperparameter = [data.sigma, data.cost]
        }
    }
    console.log(out)
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
  *          option: String,
  *          startDate: Date,
  *          endDate: Date
  * }} request All the data which will be provided from the front end. 
  * @returns The output which is generated by getTraingDataTif
  */
 async function calculateAOA(request) {

    let processedData = processInputData(request);
    let output = {}
    if (processedData.option == 'data') {
        output.message = await calculateNewModelAndAOA(processedData.algorithm, processedData.filePath, processedData.hyperparameter, processedData.desiredBands)
        console.log("Model, prediction and AOA created successfully")
    } else if (processedData.option == 'model') {
        output.message = await calculateAOAwithGivenModel(processedData.filePath, processedData.desiredBands)
        console.log("Prediction and AOA created successfully")
    }
    return output;
}


 module.exports = {
    calculateAOA
};