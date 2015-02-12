// CURRENTLY UNUSED
//Model for storing information about the individual buses
var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	busSchema = new Schema( {
		VehicleID: Number,
		Position{
			Latitude: Number,
			Longitude: Number
		},
		RouteNumber: Number,
		DestinationName: String,
		Direction: Number, 			// I believe this value is just a boolean, but I might be wrong
		//busStops:[ {IDs: number} ], // This one might change to list the bus stops instead of just their IDs
		NextStopID: Number, 		// This one might change to list the bus stop instead of just the ID
		ExpectedArrivalTime: Date, 	// For the next stop. Could be used to trigger next update
		AimedArrivalTime: Date, 	// For the next stop
		LastUpdated: Date 			// Contains time of last update
	})
Bus = mongoose.model('bus', busSchema);

module.exports = Bus;