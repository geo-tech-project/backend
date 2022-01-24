const request = require("supertest")
const assert = require('assert')
const app = require("../app.js")
var expect = require('chai').expect;
var { calculateAOA, processInputData, calculateAOAwithGivenModel, calculateNewModelAndAOA } = require("../useR_ML_AOA");

var inputObjectModel = {
    option: 'model',
    filePath: 'model.RDS',
    channels: ['B02', 'B03', 'B04', 'B05'],
}

var inputObjectData = {
    option: 'data',
    filePath: './R/training_data/trainingsdaten_koeln_4326.gpkg',
    channels: ['B02', 'B03', 'B04', 'B05'],
    algorithm: "rf",
    mtry: 2
}

//Testing processInpuData with given model
describe('#processInputDataModel()', function () {
    context('with json argument', function () {
        it('should return object', function () {

            var result = processInputData(inputObjectModel);

            expect(result)
                .to.be.a('Object')

        })
    })
})

//Testing processInpuData with training data
describe('#processInputDataTrainingData()', function () {
    context('with json argument', function () {
        it('should return object', function () {

            var result = processInputData(inputObjectData);

            console.log("result processInputDataTrainingData: ", result)

            expect(result)
                .to.be.a('Object')

        })
    })
})

//Testing calculateNewModelAndAOA 
describe('#calculateNewModelAndAOA()', function () {
    context('with json argument', function () {
        it("should return model", function () {

            var result = calculateNewModelAndAOA("rf", './R/training_data/trainingsdaten_koeln_4326.gpkg', [2], ['B02', 'B03', 'B04', 'B05']);

            console.log("result calculateNewModelAndAOA: ", result)

            expect(result)
                .to.be.a('Object')

        }).timeout(300000)
    })
})

//Testing calculateAOAwithGivenModel
describe('#calculateAOAwithGivenModel()', function () {
    context('with object argument', function () {
        it('should return object', async function () {
            var result = await calculateAOAwithGivenModel('model.RDS', ['B02', 'B03', 'B04', 'B05'])

            expect(result)
                .to.be.a('Object')
        }).timeout(300000)
    })
})



//Test of demo route
describe("POST /start", function () {
    it("Should return status code 200", async function () {
        await request(app)
            .post("/start")
            .send({
                whereareyoufrom: 'demo',
                topleftlat: 51.946286720328104,
                topleftlng: 7.5971644627228905,
                bottomleftlat: 51.975309509611826,
                bottomleftlng: 7.5971644627228905,
                bottomrightlat: 51.975309509611826,
                bottomrightlng: 7.652018947455736,
                toprightlat: 51.946286720328104,
                toprightlng: 7.652018947455736,
                option: 'model',
                algorithm: 'rf',
                startDate: '2021-05-31T22:00:00.000Z',
                endDate: '2021-08-30T22:00:00.000Z',
                filename: 'model.RDS',
                resolution: '10',
                channels: ['B02', 'B03', 'B04', 'SCL'],
                coverage: 20,
                mtry: 2
            })
            .expect(200)
    }).timeout(300000)
})


// Test of start route 
describe("POST /start", function () {
    this.timeout(30000)
    it("Should return status code 200 if function gets started", async function () {
        await request(app)
            .post("/start")
            .send({
                whereareyoufrom: 'map',
                topleftlat: 51.94630759340601,
                topleftlat: 51.94630759340601,
                topleftlng: 7.603957437562283,
                bottomleftlat: 51.972977513862844,
                bottomleftlng: 7.603957437562283,
                bottomrightlat: 51.972977513862844,
                bottomrightlng: 7.662288948274864,
                toprightlat: 51.94630759340601,
                toprightlng: 7.662288948274864,
                option: 'data',
                algorithm: 'rf',
                startDate: '2021-07-03T22:00:00.000Z',
                endDate: '2021-07-17T22:00:00.000Z',
                filename: 'trainingsdaten_muenster_32632.gpkg',
                resolution: '400',
                channels: ['B02', 'B03', 'B04', 'B05'],
                coverage: 50,
                mtry: null
            })
            .expect(200)
    }).timeout(300000)
})