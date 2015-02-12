var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	stopVisitSchema = new Schema( {
		BusStopID: Number,
		BusStopName: String,
		Position: {
			Longitude: Number,
			Latitude: Number
		},
		StopVisits
		[
			{
				VehicleID: Number,
				LineID: Number,
				LineName: String,
				Direction: Number
				OriginID: Number,
				OriginName: String,
				DestinationID: Number,
				DestinationName: String,
				Arrival:
				{
					AimedArrivalTime: Date,
					ExpectedArrivalTime: Date,
					AimedDepartureTime: Date,
					ExpectedDepartureTime: Date
				}
			}
		]
	})
StopVisits = mongoose.model('stopVisits', stopVisitSchema);

module.exports = StopVisits;

/*
var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	stopVisitSchema = new Schema( {
		VehicleID: Number,
		LineID: Number,
		LineName: String,
		Direction: Number
		OriginID: Number,
		OriginName: String,
		DestinationID: Number,
		DestinationName: String,
		BusStops[
			{
				BusStopID: Number,
				BusStopName: String,
				Position: {
					Longitude: Number,
					Latitude: Number
				},
				AimedArrivalTime: Date,
				ExpectedArrivalTime: Date,
				AimedDepartureTime: Date,


			}
		]
	})
StopVisits = mongoose.model('stopVisits', stopVisitSchema);

module.exports = StopVisits;
*/





