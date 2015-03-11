var mongoose = require('mongoose')
	,Schema = mongoose.Schema
	interStopPolylineSchema = new Schema( {
		PreviousStopID: Number,
		NextStopID: Number,
		Polyline: String,
		Bounds: {
			northeast: {
				Latitude: Number,
				Longitude: Number
			},
			southwest: {
				Latitude: Number,
				Longitude: Number
			}
		},
		Legs: [{
			Distance: Number,
			Start_location: {
				Latitude: Number,
				Longitude: Number
			},
			End_location: {
				Latitude: Number,
				Longitude: Number
			},
			Steps: [{
				Distance: Number,
				Polyline: String,
				Start_location: {
					Latitude: Number,
					Longitude: Number
				},
				End_location: {
					Latitude: Number,
					Longitude: Number
				},
			}]
		}]

	})
InterStopPolyline = mongoose.model('InterStopPolyline', interStopPolylineSchema);

module.exports = InterStopPolyline;