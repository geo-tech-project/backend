const R = require('./R.js');

const rFilePath = './R/GetSatelliteImages.R';

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
let configs_aoi = {
    bottomLeftX: 7,
    bottomLeftY: 50,
    topRightX: 8,
    topRightY: 51,
    datetime: {
        val: '2015-06-01/2021-06-30',
        type: "String"
    },
    limit: 100,
    desiredBands: {
        type: 'String',
        val: ["B02", "B03", "B04", "SCL"]
    },
    resolution: 20,
    cloudCoverageInPercentage: 20

}
async function executeAndLog(rFilePath, functionName, paramObj) {
    let output;
    try {
        output = await R.callMethodAsync(rFilePath, functionName, paramObj)
    } catch (e) {
        output = e;
    }
    return output;
}

foo = async () => {
    let out = await executeAndLog(rFilePath, 'generateSatelliteImageFromTrainingData', configs)
    console.log(out);

}

foo()