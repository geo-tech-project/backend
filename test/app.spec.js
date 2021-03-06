const request = require("supertest")
const assert = require('assert')
const app = require("../app.js")
var expect = require('chai').expect;
var { calculateAOA, processInputData, calculateAOAwithGivenModel, calculateNewModelAndAOA } = require("../useR_ML_AOA");
var { getData } = require("../useR_AOI_TD");
const { ok } = require("assert");

//Input data
var data = {
    areyouatest: true,
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
    resolution: '20',
    channels: ['B02', 'B03', 'B04', 'B05'],
    coverage: 50,
    mtry: 2
}



//Test of demo route
describe("POST /start", function () {
    it("Should return status code 200", async function () {
        await request(app)
            .post("/start")
            .send({
                areyouatest: true,
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
    it("Should return status code 200 if function gets started", async function () {
        await request(app)
            .post("/start")
            .send({
                areyouatest: true,
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
                resolution: '20',
                channels: ['B02', 'B03', 'B04', 'B05'],
                coverage: 50,
                mtry: 2
            })
            .expect(200)
    }).timeout(300000)
})

//Testing getData to generate Satellite images
describe('#getData()', function () {
    context('with input argument', function () {
        it('should return object, aoi status ok, trainingData status ok', async function () {
            var result = await getData(data);
            expect(result)
                .to.be.a('Object')
            expect({ result: { status: 'ok' } }).to.deep.equal({ result: { status: 'ok' } })
            expect({ result: { aoi: { status: 'ok' } } }).to.deep.equal({ result: { aoi: { status: 'ok' } } })
            expect({ result: { trainingData: { status: 'ok' } } }).to.deep.equal({ result: { trainingData: { status: 'ok' } } })
        }).timeout(300000)
    })
})



//Testing calculateAOA processedData.algorithm, processedData.filePath, processedData.hyperparameter, processedData.desiredBands
describe('#calculateAOA()', function () {
    context('with input argument', function () {
        it("should return object, training status ok, classifyAndAOA status ok", async function () {
            var result = await calculateAOA(data);
            expect(result)
                .to.be.a('Object')
            expect({ result: { training: { status: 'ok' } } }).to.deep.equal({ result: { training: { status: 'ok' } } })
            expect({ result: { classifyAndAOA: { status: 'ok' } } }).to.deep.equal({ result: { classifyAndAOA: { status: 'ok' } } })
        }).timeout(300000)
    })
})