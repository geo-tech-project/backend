const {
    default: axios
} = require('axios');
const https = require('axios');
const {
    Coordinate
} = require('./lib/coordinates.js');

/**
 * Dummy bbox to test the getStacLinks function, defined as object with properties for all four arguments
 */
const bbox = {
    bottomLeft: new Coordinate(51.899, 7.5492),
    topRight: new Coordinate(52.0069, 7.7195)
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
 * @param {{bottomLeft:Coordinate,topRight:Coordinate}} bbox The bounding box in which the Api should search.
 * @param {String} datetime The Date and Time in which the Api should search. 
 * @param {Number} limit The limit of matching results, which will be returned. By default 1 
 */
async function getStacLinks(bbox, datetime, limit = 1) {

    let response = await axios.post('https://earth-search.aws.element84.com/v0/collections/sentinel-s2-l2a-cogs/items', JSON.stringify({
        bbox: [bbox.bottomLeft.lon, bbox.bottomLeft.lat, bbox.topRight.lon, bbox.topRight.lat],
        limit: 500,
        //datetime: datetime
    }));

    if (response.data.numberMatched == 0) {
        return new Error("No matches found");
    }
    let features = response.data.features;
    for (let i = 0; i < 10; i++) {
        let coords = []
        for (let j = 0; j < features[i].geometry.coordinates[0].length; j++) {
            const element = features[i].geometry.coordinates[0][j];
            coords.push(new Coordinate(element[1], element[0]))

        }
        console.log(coords);

    }
}

module.exports = {
    getStacLinks: getStacLinks
}

async function foo() {
    let out = await getStacLinks(bbox, datetime);
    console.log(out);
}

/**
 * 
 * @param {Coordinate[]} sentinelBBox 
 * @param {{bottomLeft:Coordinate,topRight:Coordinate}} aoiBBox
 * @return boolean  
 */
function covers(sentinelBBox, aoiBBox) {
    let aoiBBoxCoordinates = calculateCoordinatesOfBBox(aoiBBox);
    //Check Bottom left
    if (!(aoiBBoxCoordinates[0].lat >= sentinelBBox[0].lat && aoiBBoxCoordinates[0].lon >= sentinelBBox[0].lon)) {
        return false;
    }
    //Check Bottom right
    if (!(aoiBBoxCoordinates[1].lat >= sentinelBBox[1].lat && aoiBBoxCoordinates[1].lon <= sentinelBBox[1].lon)) {
        return false;
    }
    //Check Top right
    if (!(aoiBBoxCoordinates[2].lat <= sentinelBBox[2].lat && aoiBBoxCoordinates[2].lon <= sentinelBBox[2].lon)) {
        return false;
    }
    //Check Top left
    if (!(aoiBBoxCoordinates[3].lat <= sentinelBBox[3].lat && aoiBBoxCoordinates[3].lon >= sentinelBBox[3].lon)) {
        return false;
    }
    return true;


}
/**
 * Constructs an Array with Coordinate objects, which containss all four edges from the bbox, by calculating the other coordinates as an rectangle. 
 * @param {{bottomLeft: Coordinate, topRight: Coordinate}} bbox 
 * @returns An Array with the four edge coordinates starting at bottom left, going against Clockwise.
 */
function calculateCoordinatesOfBBox(bbox) {
    let bottomRight = new Coordinate(bbox.bottomLeft.lat, bbox.topRight.lon);
    let topLeft = new Coordinate(bbox.topRight.lat, bbox.bottomLeft.lon);

    return [bbox.bottomLeft, bottomRight, bbox.topRight, topLeft]
}
let sentinel = [new Coordinate(51.345411529388265,6.955681858726791), new Coordinate(51.35608867427884,8.704563853378611,),
    new Coordinate(52.343045231941964,8.675910143783926),
    new Coordinate(52.33923939790223,7.37137307058319),
    new Coordinate(51.345411529388265,6.955681858726791)
]

//foo()
 let cover = covers(sentinel,bbox);
 console.log(cover);