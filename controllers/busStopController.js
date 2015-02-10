var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');

exports.getBusStops = function(req,res){
	var operatorParam = req.params.operator;

	busStopModel.find({Operator: operatorParam}, function(err, busStopList){
		if(err)
			return console.error(err);
		res.send(busStopList);
	})
}

exports.getBusStopsOnLine = function(req,res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;
	console.log("params: " + operatorParam + ", " + lineIDParam);

	busLineModel.find({LineID: lineIDParam})
	.where('Operator').equals(operatorParam)
	.exec(function(err, busLine){
		if(err) return console.error(err);
		if(busLine==null){
			res.send();
		}
		console.log(busLine);
		var busStopIDs = busLine[0].BusStops;
		var busStops = [];

		//function for ensuring that the async calls are in the same order as the list
		function series(busStopID){
			console.log(busStopID);
			if(busStopID){
				busStopModel.find({Operator: operatorParam})//({ID: busStopID})
				.where('ID').equals(busStopID)
				.exec(function(err, busStop){
					if(err) console.log(err);
					console.log(busStop[0]);
					busStops.push(busStop[0]);
					return series(busStopIDs.shift());
				});
			} else {
				res.send(busStops);
			}
		}
		series(busStopIDs.shift());

	})
}

