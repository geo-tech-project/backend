const request = require("supertest")
const assert = require('assert')
const app = require("../app.js")


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
    it("Should return status code 200 if function gets started", async function () {
        await request(app)
            .post("/start")
            .send({
                whereareyoufrom: 'map',
                topleftlat: 51.95040183546208,
                topleftlng: 7.608311651295573,
                bottomleftlat: 51.96944221561243,
                bottomleftlng: 7.608311651295573,
                bottomrightlat: 51.96944221561243,
                bottomrightlng: 7.639223889105581,
                toprightlat: 51.95040183546208,
                toprightlng: 7.639223889105581,
                option: 'data',
                algorithm: 'rf',
                startDate: '2021-07-03T22:00:00.000Z',
                endDate: '2021-07-24T22:00:00.000Z',
                filename: 'trainingsdaten_koeln_4326.gpkg',
                resolution: '400',
                channels: ['B02', 'B03', 'B04', 'B05'],
                coverage: 71,
                mtry: 2
            })
            .expect(200)
    }).timeout(300000)
})