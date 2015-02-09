var mongoose = require('mongoose')
        ,Schema = mongoose.Schema
        busStopSchema = new Schema( {
        	ID: Number,
                name: String,
                city: String,
                lat: Number,
                long: Number,
                operator: String,
                busLines: [ {type: Number} ],
                lastUpdated: Date
        })
BusStop = mongoose.model('busStop', busStopSchema);

module.exports = BusStop;