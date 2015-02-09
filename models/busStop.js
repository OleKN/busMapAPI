// Model used for storing bus stops
// It should be updated periodically, but not too often as they seldom change

var mongoose = require('mongoose')
        ,Schema = mongoose.Schema
        busStopSchema = new Schema( {
        	ID: Number,
                name: String,
                city: String,
                Position{
                        Latitude: Number,
                        Longitude: Number
                },
                operator: String,
                busLines: [ {type: Number} ],
                lastUpdated: Date
        })
BusStop = mongoose.model('busStop', busStopSchema);

module.exports = BusStop;