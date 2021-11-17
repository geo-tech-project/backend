
class Coordinate {

    /**
     * Build a coordinate object with a coordinate as Lat,Lon
     * @param {Number} lat Latitude in WGS84. 
     * @param {Number} lon Longitude in WGS84.
     */
    constructor(lat,lon){
        this.lat = lat;
        this.lon = lon;
    }

    /**
     * 
     * @returns The Coordinate as [lat, lon] object
     */
    toLatLonArray(){
        return [this.lat,this.lon] 
    }

    /**
     * 
     * @returns The coordinate as [lon, lat] object
     */
    toLonLatArray(){
        return [this.lon,this.lat]
    }

    /**
     * 
     * @returns All data from the object.
     */
    data(){
        return {
            lat: this.lat,
            lon: this.lon
        }
    }
}

module.exports = {Coordinate};

