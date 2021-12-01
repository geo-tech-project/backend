const R = require('./R.js');

const rFilePath = './R/GetSatelliteImages.R';

let trainingDataPath = "./R/Trainingsdaten/trainingsdaten_kenia_2_4326.gpkg";
let datetime = '2021-06-01/2021-06-30';
let limit = 100;
let desiredBands = ["B02", "B03", "B04", "SCL"];
let resolution = 200;
let cloudCoverageInPercentage = 20;
let functionName = 'generateSatelliteImageFromTrainingData';

let configs = {
    trainingDataPath: {
        val: "./R/Trainingsdaten/trainingsdaten_kenia_2_4326.gpkg",
        type: "String"
    },
    datetime: {
        val: '2021-06-01/2021-06-30',
        type: "String"
    },
    limit: 100,
    desiredBands: {
        type: 'String',
        val: ["B02", "B03", "B04", "SCL"]
    },
    resolution: 200,
    cloudCoverageInPercentage: 20
}

 async function executeAndLog(rFilePath,functionName,paramObj){
    try{let output = await R.callMethodAsync(rFilePath,functionName,paramObj)}catch(e){
        return e;
    }
    return output;
}

foo = async () => {
    let out = await executeAndLog(rFilePath,functionName,configs)
    console.log(out);

}

foo()

