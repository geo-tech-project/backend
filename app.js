const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const {
    getData
} = require('./useR');
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
    console.log("/start");
    console.log(req.body);
    let response = {}
    response.stac = await getData(req.body);
    if (response.stac.status === "error") {
        res.status(400).send(response);
        console.log("/start 400", response);
    } else {
        response.aoa = await calculateAOA(req.body);
        console.log("/start 200", response);
        res.send(response);
    }
})

// route to return uploaded file
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

app.get('/json', (req, res, next) => {
    res.sendFile(path.join(__dirname, './R/prediction_and_aoa/classes.json'));
})

app.get('/marker', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/marker.png'));
})

app.get('/rundemo', (req, res, next) => {
    console.log('calculation demo..');
    callMethodAsync(__dirname + "/R/DEMO.R", "rundemo", [""]).then((result) => {
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