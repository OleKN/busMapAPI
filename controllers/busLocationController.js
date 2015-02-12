var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');
var busStopController = require('./busStopController');
var request = require('request');
var _ = require('underscore');

var busStopVisitURL = "http://reisapi.ruter.no/stopvisit/GetDepartures/"; // + StopID + ?json=true&linenames= + ID

// returns all bus Lines, from the database for a given bus operator
exports.getBusLinesByOperator = function(req, res){
	var operatorParam = req.params.operator;

	busLineModel.find({Operator: operatorParam , BusStops: {$ne: []}} , {_id: 0, __v: 0}, function(err, busLineList){
		if(err)
			return console.error(err);
		res.send(busLineList);
	})
}

// Returns all buses stop visits, for all buses for a given line and operator
exports.getBusLocationByLine = function(req, res){
	var operatorParam = req.params.operator;
	var lineNameParam = req.params.lineName;
	getBusLocation(operatorParam, lineNameParam, function(arrivalList){
		res.send(arrivalList);
	})
}

function getBusLocation(operator, busLineName, callback){
	getRealTimeBusLineArrivals(operator, busLineName, function(arrivals){


		// Sort by busID and arrival time
		arrivals.sort(function(a, b){
			if(a.MonitoredVehicleJourney.VehicleRef > b.MonitoredVehicleJourney.VehicleRef)
				return 1;
			if(a.MonitoredVehicleJourney.VehicleRef < b.MonitoredVehicleJourney.VehicleRef)
				return -1;
			if(a.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime > b.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime)
				return 1;
			if(a.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime < b.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime)
				return -1;
			return 0;
		})




		// Do a database lookup into bus stop positions

		var cb = _.after(arrivals.length, callback);

		for(var i = 0; i < arrivals.length; i++){
			// function that will store i for each iteration, 
			// so that i can be used in each async call
			(function(index){
				busStopModel.find({Operator: operator})
				.where('ID').equals(arrivals[index].MonitoringRef)
				.exec(function(err, busStop){
					if(err) 
						return console.error(err);
					if(busStop[0] == null) 
						return console.log("Unable to find bus stop");
					arrivals[index].busStopPosition = busStop[0].Position;
					cb(arrivals);
				})
			})(i)
		}
	})
}

// Looks up all bus stops for the given line and operator
// it then sends all arrival times to the callback function
function getRealTimeBusLineArrivals(operator, busLineName, callback){
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

		// Function that will call callback once all the bus stops have been queried for arrivals
		var cb = _.after(busStopIDs.length, function(arrivals){
			callback(arrivals);
		});

		// Ask for bus stop visits for every bus stop for a given line
		for(var i = 0; i < busStopIDs.length; i++){
			request({
				url: busStopVisitURL + busStopIDs[i] + "?json=true&linenames=" + busLineName,
				json: true
				}, function(error, reponse, busStopVisitList){
					for(var y = 0; y < busStopVisitList.length; y++){
						if(busStopVisitList[y].MonitoredVehicleJourney.VehicleRef != null){
							arrivals.push(busStopVisitList[y]);
						}
					}
					cb(arrivals);					
				}
			)
		}

	})
}