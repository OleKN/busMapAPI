//Model for storing information about lines
//Which stops they visit, and which order
var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	lineSchema = new Schema( {
		LineID: Number,
		Name: String,
		LineColor: String,
		Operator: String,

		BusStops: [ {type: Number} ],
		/*Direction: [ {
			DirectionID: Number, // usually just '1' or '2'
			DestinationName: String,
			DestinationID: Number,
			OriginName: String,
			OriginID: Number,
			BusStopVisits[ {
				BusStop: Number,
				MinutesSinceLast: Number,
				MinutesWaitTime: Number
			} ],

		}],*/


		Transportation: Number,
		LastUpdated: Date
	})

BusLine = mongoose.model('busLine', lineSchema);

module.exports = BusLine;



//Transportation explained:
// 0 Walking
// 1 AirportBus	
// 2 Bus	
// 3 Dummy	
// 4 AirportTrain	
// 5 Boat	
// 6 Train	
// 7 Tram	
// 8 Metro