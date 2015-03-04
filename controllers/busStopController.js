var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');
var gmaputil = require('googlemapsutil');



exports.getBusStops = function(req,res){
	var operatorParam = req.params.operator;

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
		res.send(busStopList);
	})
}

function findBusStopOnLine(operatorParam, lineIDParam, callback){
	// Finds all bus stop ids on a line
	busLineModel.find({LineID: lineIDParam})
	.where('Operator').equals(operatorParam)
	.exec(function(err, busLine){
		if(err) return console.error(err);
		if(busLine==null){
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
				//res.send(busStops);
				callback(busStops);
			}
		}
		series(busStopIDs.shift());

	})
}


exports.getBusLineInfo = function(req, res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;

	busLineModel.findOne({Operator: operatorParam , LineID: lineIDParam} , { _id: 0, __v: 0}, function(err, busLine){
		if(err)
			return console.error(err);

		var polyline = getDirections(busLine);

		busLine.Polyline = polyline;
		res.send(busLine);
	})
}


function getDirections(busLine){
	if(busLine.StopVisits == null){
		// Update stopVisits in busLocationController
		console.log("Empty!");
		return "hello";
	}

	// find origin and destination in StopVisit list
	findBusStopOnLine(busLine.Operator, busLine.LineID, function(busStopList){
		for(var i=0; i<busStopList.length; i++){
			console.log(busStopList[i].Position.Latitude + ", " + busStopList[i].Position.Longitude);
		}
		console.log("Hello");
		return "hello to you!";
	})	
}
