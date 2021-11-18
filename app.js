const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');

const {getStacLinks} = require('./stacApiRequest');

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

app.get('/', (req, res, next) => {
    console.log('get /')
    res.send('yup')
})

app.get('/stac',(req,res,next) => {

});
app.get('/image/:name', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public/uploads/', req.params.name));
})

app.post('/start', (req, res, next) => {
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
    res.send(jsonData);
})

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