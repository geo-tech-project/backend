const https = require('https');

/**
 * Dummy bbox to test the getStacLinks function, defined as object with properties for all four arguments
 */
const bbox = {
    bottomLeftLat: 0,
    bottomLeftLon: 7,
    topRightLat: 50,
    topRightLon: 80
}

/**
 * String with the date and time in which the Stac Api should search. 
 */
const datetime = '2021-11-15T10:00:31Z/2021-01-01T00:01:00Z'

/**
 * 
 * NOT WORKING!!!
 * 
 * These function makes a postRequest to the AWS Service and returning all links with all Bands.
 * 
 *  
 * @param {{bottomLeftLat:Number,bottomLeftLon:Number,topRightLat:Number,topRightLon:Number}} bbox The bounding box in which the Api should search.
 * @param {String} datetime The Date and Time in which the Api should search. 
 * @param {Number} limit The limit of matching results, which will be returned. By default 1 
 */
async function getStacLinks(bbox, datetime, limit = 1) {
    const data = JSON.stringify({
        bbox: [bbox.bottomLeftLat, bbox.bottomLeftLon, bbox.topRightLat, bbox.topRightLon],
        limit: limit,
        //datetime: datetime
    })
    const options = {
        hostname: 'https://earth-search.aws.element84.com/v0/collections/sentinel-s2-l2a/items',
        method: 'POST',

    }

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);

        res.on('data', d => {
            process.stdout.write(d)
        })
    })

    req.on('error', error => {
        //console.log(data);
        console.error(error.message)
    })

    req.write(data)
    req.end()

}

getStacLinks(bbox, datetime);