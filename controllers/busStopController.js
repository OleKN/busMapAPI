var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');
var interStopPolylineModel = require('../models/interStopPolyline');
var directions = require('./directionsController');
var request = require('request');



exports.getBusStops = function(req,res){
	var operatorParam = req.params.operator;

	var date = new Date();
	console.log(date + " getBusStops/" + operatorParam);

	busStopModel.find({Operator: operatorParam} , { _id: 0, __v: 0}, function(err, busStopList){
		if(err)
			return console.error(err);
		res.send(busStopList);
	})
}

// finds all bus stops on a given line
exports.getBusStopsOnLine = function(req,res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;
	findBusStopOnLine(operatorParam, lineIDParam, function(busStopList){
		if(busStopList == null){
			res.send("Unable to find route");
		}else{
			res.send(busStopList);
		}
	})
}

function findBusStopOnLine(operatorParam, lineIDParam, callback){
	// Finds all bus stop ids on a line
	busLineModel.find({LineID: lineIDParam})
	.where('Operator').equals(operatorParam)
	.exec(function(err, busLine){
		if(err) return console.error(err);
		if(busLine==null || busLine.length == 0 || busLine[0] == null || busLine[0].BusStops == null){
			//res.send();
			callback(null);
		}
		var busStopIDs = busLine[0].BusStops;
		var busStops = [];

		// function for ensuring that the async calls are in the same order as the list
		// It asks for all bus stops given the IDs found in the given bus Line
		function series(busStopID){
			if(busStopID){
				busStopModel.find({Operator: operatorParam} , { _id: 0, __v: 0})//({ID: busStopID})
				.where('ID').equals(busStopID)
				.exec(function(err, busStop){
					if(err) console.log(err);
					busStops.push(busStop[0]);
					return series(busStopIDs.shift());
				});
			} else {
				callback(busStops);
			}
		}
		series(busStopIDs.shift());

	})
}


exports.getBusLineInfo = function(req, res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;

	var date = new Date();
	console.log(date + " getBusLineInfo/" + operatorParam + "/" + lineIDParam);

	busLineModel.findOne({Operator: operatorParam , LineID: lineIDParam} , { _id: 0, __v: 0}, function(err, busLine){
		if(err)
			return console.error(err);

		//var polyline = directions.getDirections(busLine, function(polyline){
		//	busLine.Polyline = polyline;
			res.send(busLine);
		//});
	})
}

