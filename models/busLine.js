// Model for storing information about lines
// Type of transport, name, which stops they visit and in which order


//Transportation field explained:
// 0 Walking
// 1 AirportBus	
// 2 Bus	
// 3 Dummy	
// 4 AirportTrain	
// 5 Boat	
// 6 Train	
// 7 Tram	
// 8 Metro

var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	lineSchema = new Schema( {
		LineID: Number,
		Name: String,
		LineColor: String,
		Operator: String,
		BusStops: [ {
			type: Number
		} ],
		StopVisits: [ {
			BusStopID: Number,
			TimeSinceLast: Number,
			PreviousStopID: Number,
			Direction: Number,
			DestinationID: Number,
			DestinationName: String
		} ],
		Transportation: Number,
		LastUpdated: Date
	})

BusLine = mongoose.model('busLine', lineSchema);

module.exports = BusLine;