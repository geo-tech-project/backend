const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const { getData } = require('./useR');
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
    let response = await getData(req.body);
    res.send(response);
})

// route to return uploaded file
app.get('/file/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/uploads/', req.params.name));
})

// route to return uploaded file
app.get('/stack/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/stack/', req.params.name));
})

app.post('/calculateaoi', (req, res, next) => {
    var jsonData = req.body
    console.log(jsonData);
    console.log("calculating aoi...");
    callMethodAsync("ML_AOA.R", "calculateAOA", ["2"]).then((result) => {
        console.log(result);
        res.send(result);
    }).catch((error) => {
        console.error(error);
        res.send(error);
    })
})

app.get('/rundemo', (req, res, next) => {
    console.log('calculation demo..');
    callMethodAsync("ML_AOA.R", "calculateAOA", ["2"]).then((result) => {
        console.log(result);
        res.send(result);
    }).catch((error) => {
        console.error(error);
        res.send(error);

      // async prototype
app.get("/async", (req, res, next) => {
    console.log("testing asyncronously...")
    let algorithm = '"rf"';
    let trees = 75;
    callMethodAsync("./R/ML_AOA.R", "training", {algorithm: 'rf', trees: 75}).then((result) => {
        console.log(result)
        callMethodAsync("./R/ML_AOA.R", "classifyAndAOA", ["success"]).then((result) => {
            console.log(result);
            res.send('success')
        }).catch((error) => {
            console.error(error);
        })
    }).catch((error) => {
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
}
);