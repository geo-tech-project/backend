const express = require('express');
const path = require('path');
const multer = require('multer');
var cors = require('cors');
const R = require('r-integration');

const PORT = process.env.PORT || 3000;

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
app.use(express.urlencoded({
    extended: true
}));
app.use(cors());


// route to return uploaded file
app.get('/file/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/uploads/', req.params.name));
})

// route to return uploaded file
app.get('/stack/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/stack/', req.params.name));
})

app.post('/calculateaoi', (req, res, next) => {
    var jsonData = {
        aoi: {
            topleft: {
                lat: req.body.topleftlat,
                lng: req.body.topleftlng
            },
            bottomleft: {
                lat: req.body.bottomleftlat,
                lng: req.body.bottomleftlng
            },
            bottomright: {
                lat: req.body.bottomrightlat,
                lng: req.body.bottomrightlng
            },
            topright: {
                lat: req.body.toprightlat,
                lng: req.body.toprightlng
            },
        },
        option: req.body.option,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        filename: req.body.filename
    }
    console.log(jsonData);
    console.log("calculating aoi...");
    callMethodAsync("ML_AOA.R", "calculateAOA", ["2"]).then((result) => {
        console.log(result);
        res.send(result);
    }).catch((error) => {
        console.error(error);
        res.send(error);
    })
    //res.send(jsonData);
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

app.listen(PORT, () =>
    console.log(`Example app listening on port ${PORT}`),
);