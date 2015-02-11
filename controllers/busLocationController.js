var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');
var busStopController = require('./busStopController');
var request = require('request');
var _ = require('underscore');

var busStopVisitURL = "http://reisapi.ruter.no/stopvisit/GetDepartures/"; // + StopID + ?json=true&linenames= + ID


exports.getBusLinesByOperator = function(req, res){
	var operatorParam = req.params.operator;

	busLineModel.find({Operator: operatorParam}, function(err, busLineList){
		if(err)
			return console.error(err);
		res.send(busLineList);
	})
}

exports.getBusLocationByLine = function(req, res){
	var operatorParam = req.params.operator;
	var lineNameParam = req.params.lineName;
	getBusLocation(operatorParam, lineNameParam, function(arrivalList){
		res.send(arrivalList);
	})
}
/*
function getBusLocation(operator, busLineName, callback){
	getRealTimeBusLineArrivals(operator, busLineName, function(arrivals){
		// filter nulls

		// sort by busID and arrival time

	}
}
*/

function getBusLocation(operator, busLineName, callback){
	// find bus stops in the DB
	busLineModel.find({Operator: operator})
	.where("Name").equals(busLineName)
	.exec(function(err, busLine){
		if(err) 
			return console.error(err);
		if(!busLine[0])
			return "No busLineName: " + busLineName + " found for operator: " + operator;
		
		var busStopIDs = busLine[0].BusStops;
		var arrivals = [];

		var cb = _.after(busStopIDs.length, function(arrivals){
			callback(arrivals);

		});

		for(var i = 0; i < busStopIDs.length; i++){
			request({
				url: busStopVisitURL + busStopIDs[i] + "?json=true&linenames=" + busLineName,
				json: true
				}, function(error, reponse, busStopVisitList){
					for(var y = 0; y < busStopVisitList.length; y++){
						arrivals.push(busStopVisitList[y]);
					}
					cb(arrivals);
					
				}
			)
		}

	})
}