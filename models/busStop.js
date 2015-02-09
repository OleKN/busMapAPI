// Model used for storing bus stops
// It should be updated periodically, but not too often as they seldom change

var mongoose = require('mongoose')
        ,Schema = mongoose.Schema
        busStopSchema = new Schema( {
        	ID: Number,
                Name: String,
                City: String,
                Position: {
                        Latitude: Number,
                        Longitude: Number
                },
                Operator: String,
                BusLines: [ {type: Number} ],
                LastUpdated: Date
        })
BusStop = mongoose.model('busStop', busStopSchema);

module.exports = BusStop;