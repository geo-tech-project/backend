const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
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
    /**
     * Formatting all needed incomingData in the way the getData function needs them.
     */
    console.log(req.body);
    let response = {}
    response.stac = await getData(req.body);
    response.aoa = await calculateAOA(req.body);
    console.log(response);
    res.send(response);
})

// route to return uploaded file
app.get('/file/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/uploads/', req.params.name));
})

// route to return uploaded file
app.get('/stack/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './R/stack/', req.params.name));
})

app.get('/json', (req, res, next) => {
    res.sendFile(path.join(__dirname, './R/stack/classes.json'));
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
    callMethodAsync(__dirname + "/R/ML_AOA.R", "training", {algorithm: 'rf',data: '[3]'}) //Hyperparameter für die Algorithmen
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

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
});