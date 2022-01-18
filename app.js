const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const {
    getData, validateTrainingData
} = require('./useR_AOI_TD');
const {
    calculateAOA
} = require('./useR_ML_AOA');
var cors = require('cors');
const R = require('r-integration');

const PORT = process.env.PORT || 8781;

// storage for multer upload
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

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());

app.post('/start', async (req, res, next) => {

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
    if(req.body.option === "data"){
        let path = "./public/uploads/" + req.body.filename;
        let valid = await validateTrainingData(path);
        if(valid.status === "error"){
            res.status(401).send({
                status: "error",
                message: 'Invalid training data',
                error: valid
            });
            return
        }
    }
    response.stac = await getData(req.body);
    if (response.stac.status === "error") {
        res.status(402).send(response);
        console.log("/start 400", response);
    } else {
        response.aoa = await calculateAOA(req.body);
        console.log("/start 200", response);
        res.send(response);
    }
    }
});
// route to return uploaded file
// DEFAULT
app.get('/file/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/uploads/', req.params.name));
})

app.get('/model/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './R/model/', req.params.name));
})

// Prediction and AOA
app.get('/predictionaoa/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './R/prediction_and_aoa/', req.params.name));
})

// Sentinel images
app.get('/processedsentinelimages/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './R/processed_sentinel_images/', req.params.name));
})

// Further train areas
app.get('/furthertrainareas/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './R/further_train_areas/', req.params.name));
})

// training polygons
app.get('/trainingdata/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/uploads/', req.params.name));
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
app.post('/upload', upload.single('file'), function (req, res) {
    if (!req.file) {
        console.log("No file is available!");
        return res.send({
            success: false
        });

    } else {
        console.log('File is available!');
        return res.send({
            success: true
        })
    }
});

app.post("/deleteFiles", async (req, res) => {
    console.log("delete files from public/uploads");
    try {
        await deleteFiles(__dirname + "/public/uploads", req.body.file);
        res.status(200).send("ok");
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

app.post("/getGeoJSON", async (req, res) => {
    console.log(req.body)
    try{
        // res.status(200).send(json)
        callMethodAsync(__dirname + "/R/convertGeoPackageToGeoJson.R", "convertGeoPackageToGeoJson", req.body).then((result) => {
                console.log(result);
                res.send(result);
            }).catch((error) => {
                console.error(error);
                res.send(error);
            })
    }
    catch (err) {
        res.status(400).send(err);
    }
});


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
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
});