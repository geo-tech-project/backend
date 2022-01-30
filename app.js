/**
 * @constant {module} - Swagger Express module
 */
const swaggerUi = require('swagger-ui-express');

/**
 * @constant {module} - The swagger api documentation saved in a json object 
 */
const {
    apiDocumentation
} = require('./doc/api/apidoc.js');

/**
 * @constant {module} - The express module
 */
const express = require('express');


/**
 * @constant {module} - The path module
 */
const path = require('path');

/**
 * @constant {module} - The multer module
 */
const multer = require('multer');

/**
 * @constant {module} - The body-parser module
 */
const bodyParser = require('body-parser');

/**
 * @constant {module} - The fs module
 */
const fs = require('fs');

/**
 * @constant {Object} - The functions from the ./useR_AOI_TD.js file
 * @see ./useR_AOI_TD.js
 */
const {
    getData,
    validateTrainingData
} = require('./useR_AOI_TD');

/**
 * @constant {Object} - The function from the ./useR_ML_AOA.js file
 * @see ./useR_ML_AOA.js
 */
const {
    calculateAOA
} = require('./useR_ML_AOA');

/**
 * @constant {module} - The cors module
 */
var cors = require('cors');

/**
 * @constant {module} - The R-integration module
 */
const R = require('r-integration');

/**
 * @constant {module} - The https module
 */
const https = require('https')

/**
 * @constant {module} - The resolveSoa function from the dns module
 */
const {
    resolveSoa
} = require('dns');

/**
 * @constant {number} - The port of the express server. If a port iss specified in the environment variable PORT, the port is overwritten, else
 * the port is set to 8781
 */
const PORT = process.env.PORT || 8781;

/**
 * The storage for the files send to multer
 */
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

let upload = multer({
    storage: storage
});

/**
 * @constant {Express} - The express app
 */
const app = express();

app.use(express.static(path.join(__dirname, 'doc')));
//Setting up the app
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());

app.post('/start', async (req, res, next) => {
    if (req.body.areyouatest) {
        //copy files to uplaods
        fs.copyFile(__dirname + '/R/test_data/model.RDS', __dirname + '/public/uploads/model.RDS', (err) => {
            if (err) throw err;
            console.log('model for testrun copied to destination');
        });
        fs.copyFile(__dirname + '/R/test_data/trainingsdaten_muenster_32632.gpkg', __dirname + '/public/uploads/trainingsdaten_muenster_32632.gpkg', (err) => {
            if (err) throw err;
            console.log('training data for testrun copied to destination');
        });
    }

    /**
     * Formatting all needed incomingData in the way the getData function needs them.
     */
    if (req.body.whereareyoufrom == "demo") {
        console.log("demo");
        console.log(req.body);
        // copy aoiTIF to destination
        fs.copyFile(__dirname + '/R/demo_input/demo_aoi.tif', __dirname + '/R/processed_sentinel_images/aoi.tif', (err) => {
            if (err) throw err;
            console.log('/R/demo_aoi.tif was copied to /R/processed_sentinel_images/aoi.tif');
        });
        // copy TrainingDataTIF to destination
        fs.copyFile(__dirname + '/R/demo_input/demo_trainingData.tif', __dirname + '/R/processed_sentinel_images/trainingData.tif', (err) => {
            if (err) throw err;
            console.log('/R/demo_input/demo_trainingData.tif was copied to /R/processed_sentinel_images/trainingData.tif');
        });
        // copy Model to destination
        fs.copyFile(__dirname + '/R/demo_input/demo_model.RDS', __dirname + '/public/uploads/model.RDS', (err) => {
            if (err) throw err;
            console.log('/R/demo_input/demo_model.RDS was copied to /public/uploads/model.RDS');
        });
        // copy Model to destination
        fs.copyFile(__dirname + '/R/demo_input/demo_model.RDS', __dirname + '/R/model/model.RDS', (err) => {
            if (err) throw err;
            console.log('/R/demo_input/demo_model.RDS was copied to /R/model/model.RDS');
        });
        let response = await calculateAOA(req.body);
        res.send(response);
    } else {
        console.log(req.body);
        let response = {}
        response.stac = await getData(req.body);
        if (response.stac.status === "error") {
            res.status(402).send(response);
            console.log("/start 400", response);
        } else {
            response.aoa = await calculateAOA(req.body);
            if (response.aoa.status === "error") {
                res.status(403).send(response);
                console.log("/start 400", response)
            } else {
                console.log("/start 200", response);
                res.send(response);
            }
        }
    }
});
// route to return uploaded file
// DEFAULT
app.get('/file/:name', (req, res, next) => {
    const filePath = path.join(__dirname, 'public/uploads', req.params.name);
    checkFileNotFound(filePath, res);
    res.sendFile(filePath);
})

app.get('/model/:name', (req, res, next) => {
    const filePath = path.join(__dirname, './R/model/', req.params.name);
    checkFileNotFound(filePath, res);
    res.sendFile(filePath);
})

// Prediction and AOA
app.get('/predictionaoa/:name', (req, res, next) => {
    const filePath = path.join(__dirname, './R/prediction_and_aoa/', req.params.name);
    checkFileNotFound(filePath, res);
    res.sendFile(filePath);
})

// Sentinel images
app.get('/processedsentinelimages/:name', (req, res, next) => {
    const filePath = path.join(__dirname, './R/processed_sentinel_images/', req.params.name);
    checkFileNotFound(filePath, res);
    res.sendFile(filePath);
})

// Further train areas
app.get('/furthertrainareas/:name', (req, res, next) => {
    const filePath = path.join(__dirname, './R/further_train_areas/', req.params.name);
    checkFileNotFound(filePath, res);
    res.sendFile(filePath);
})

// training polygons
app.get('/trainingdata/:name', (req, res, next) => {
    const filePath = path.join(__dirname, './public/uploads/', req.params.name);
    checkFileNotFound(filePath, res);
    res.sendFile(filePath);
})

app.get('/marker', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/marker.png'));
})

app.get('/rundemo', (req, res, next) => {
    console.log('calculation demo..');
    callMethodAsync(__dirname + "/R/DEMO.R", "rundemo", ["data"]).then((result) => {
        console.log(result);
        res.send(result);
    }).catch((error) => {
        console.error(error);
        res.send(error);
    })
})

// async prototype
app.get("/async", (req, res, next) => {
    console.log("testing asyncronously...")
    // hier fehlt noch eine Abfrage für den Fall das ein fertiges Modell hochgeladen wird//let algorithm = '"rf"';
    //let trees = 75;
    callMethodAsync(__dirname + "/R/ML_AOA.R", "training", {
        algorithm: 'rf',
        data: '[3]'
    }) //Hyperparameter für die Algorithmen
        .then((result) => {
            console.log(result)
            callMethodAsync(__dirname + "/R/ML_AOA.R", "classifyAndAOA", ["success"])
                .then((result) => {
                    console.log(result);
                    res.send('success')
                })
                .catch((error) => {
                    console.error(error);
                })
        })
        .catch((error) => {
            console.error(error);
        })
})


// route to upload file only for multer
app.post('/upload', upload.single('file'), async function (req, res) {
    if (!req.file) {
        console.log("No file is available!");
        return res.send({
            success: false
        });

    } else {
        console.log('File is available!');
        console.log(req.file.originalname)

        let path = "./public/uploads/" + req.file.originalname;
        let valid = await validateTrainingData(path);
        if (valid.status === "error") {
            await deleteFiles(__dirname + "/public/uploads", "dummy");
            res.status(401).send({
                status: "error",
                message: 'Invalid training data',
                error: valid
            });
            return
        }
        return res.send({
            success: true
        })
    }
});

app.post("/deleteFiles", async (req, res) => {
    console.log("delete files from public/uploads");
    console.log(req.body.file)
    let json = {
        text: "The files were deleted successfully"
    }
    try {
        await deleteFiles(__dirname + "/public/uploads", req.body.file);
        res.status(200).send(json);
    } catch (err) {
        console.log(err);
        res.status(500).send({
            "text": "Error while deleting files",
            "error": err
        });
    }
});

app.post("/getGeoJSON", async (req, res) => {
    console.log(req.body)
    try {
        let output = await R.callMethodAsync(__dirname + "/R/convertGeoPackageToGeoJson.R", "convertGeoPackageToGeoJson", req.body)
        console.log(output);
        res.send(output);
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
});

// get markdown file from repo
app.get('/markdown', (req, res, next) => {
    https.get('https://raw.githubusercontent.com/geo-tech-project/frontend/main/README.md', (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            res.send(data)
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
})

/**
 * Checking if the file at the given path actual exists. If not the function send a 404 error to the given response object.
 * If the file exists, the function does nothing and returns void.  
 * @param {String} filePath - The path were the function looking for the possible file. The path should be given absolute.
 * @param {Response} res - The response object were the function sends the error if the file does not exist.
 * @returns {void} - The function returns void.
 */
function checkFileNotFound(filePath, res) {
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).send({
                status: "error",
                message: 'File not found'
            });
            return;
        }
    });
}
/**
 * Test function for async calls
 * @code function callMethodAsync(path, method, args) { test(); }
 * @param {Test} dirPath 
 * @param {Test} fileName 
 * @returns 
 */
function deleteFiles(dirPath, fileName) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                for (const file of files) {
                    if (file !== fileName && file !== ".gitignore") {
                        fs.unlink(path.join(dirPath, file), err => {
                            if (err) {
                                reject(err);
                            } else {
                                console.log("file deleted: ", file);
                            }
                        });
                    }
                }
                resolve();
            }
        });
    });
}

app.use('/documentation', swaggerUi.serve, swaggerUi.setup(apiDocumentation));


app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
});

module.exports = app;