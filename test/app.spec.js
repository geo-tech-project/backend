const request = require("supertest")
const assert = require('assert')
const app = require("../app.js")


//Test of demo route
describe("GET /rundemo", function () {
    it("Should return status code 201", async function () {
        await request(app)
            .get("/rundemo")
            .expect(201)
    })
})


// Test of start route 
describe("POST /start", function () {
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
                filename: './R/training_data/trainingsdaten_koeln_4326.gpkg',
                resolution: '400',
                channels: ['B02', 'B03', 'B04', 'B05'],
                coverage: 50,
                mtry: null
            })
            .expect(201)
    })
})