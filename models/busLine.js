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
		LastUpdated: Date
	})

BusLine = mongoose.model('busLine', lineSchema);

module.exports = BusLine;