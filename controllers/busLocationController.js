var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');
//var stopVisitModel = require('../models/stopVisit');
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

// Returns a list of all bus stops on a line, with Real-Time arrival times of buses on those stops
exports.getRealTimeLineInfo = function(req, res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;

	getAllStopVisitsForRoute(operatorParam, lineIDParam, function(arrivalsList){
		res.send(arrivalsList);
	})
	
}

function getAllStopVisitsForRoute(operator, lineID, callback){
	// Look for bus stops for a given line
	busLineModel.find({Operator: operator, LineID: lineID})
	.exec(function(err, busLines){
		var busLine = busLines[0];
		lineName = busLine.Name;
		// check for errors in response from DB
		if(err) 
			return console.error(err);
		if(!busLine)
			return console.log("No busLineID: " + lineID + " found for operator: " + operator);
		
		var busStopIDs = busLine.BusStops;
		var arrivalsList = [];
		
		// Function that will be called after every bus stop on that line has been queried for arrivals
		var cb = _.after(busStopIDs.length, function(arrivalsList){
			callback(arrivalsList);
		});

		// Ask for bus stop visits for every bus stop for a given line
		for(var i = 0; i < busStopIDs.length; i++){
			busStopModel.findOne({ID: busStopIDs[i], Operator: operator} , function(err, busStop){
				if(err || busStop ==null){
					console.error(err);
					console.log("Error for busStop: " + busStop);
					cb(arrivalsList);
				}else{
					// Sends a request for all stops, to get real-time information about arrival times
					request({
						url: busStopVisitURL + busStop.ID + "?json=true&linenames=" + lineName,
						json: true
						}, function(error, response, busStopVisitList){
							if(!error && response.statusCode === 200){
								var stopVisits = [];
								// Store information about each arrival in a nice format
								for(var x = 0; x < busStopVisitList.length; x++){
									var newVisit = makeNewVisit(busStopVisitList[x]);
									stopVisits.push(newVisit);
								}

								// Store information about each bus stop
								var newStopVisitJSON = {
									BusStopID: busStop.ID,
									BusStopName: busStop.Name,
									Position: busStop.Position,
									StopVisits: stopVisits
								}
								arrivalsList.push(newStopVisitJSON);
								cb(arrivalsList);				
							}else{
								console.error(error);
							}
						}
					)
				}
			})
		}
	})
}

function makeNewVisit(visit){
	return {
		VehicleID: visit.MonitoredVehicleJourney.VehicleRef,
		LineID: visit.MonitoredVehicleJourney.LineRef,
		LineName: visit.MonitoredVehicleJourney.PublishedLineName,
		Direction: visit.MonitoredVehicleJourney.DirectionRef,
		OriginID: visit.MonitoredVehicleJourney.OriginRef,
		OriginName: visit.MonitoredVehicleJourney.OriginName,
		DestinationID: visit.MonitoredVehicleJourney.DestinationRef,
		DestinationName: visit.MonitoredVehicleJourney.DestinationName,
		Arrival:
		{
			AimedArrivalTime: visit.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime,
			ExpectedArrivalTime: visit.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime,
			AimedDepartureTime: visit.MonitoredVehicleJourney.MonitoredCall.AimedDepartureTime,
			ExpectedDepartureTime: visit.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime
		}
	}
}

exports.getBusPositionsOnLine = function(req, res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;

	getAllStopVisitsForRoute(operatorParam, lineIDParam, function(arrivalsList){
		var vehicles = [];
		for(var i=0; i<arrivalsList.length; i++){
			var busStop = arrivalsList[i];

			for(var j = 0; j < busStop.StopVisits.length; j++){
				var stopVisit = busStop.StopVisits[j];
				if(stopVisit.VehicleID != null){
					stopVisit.BusStopID = busStop.BusStopID;
					stopVisit.BusStopName = busStop.BusStopName;
					stopVisit.BusStopPosition = busStop.Position;
					vehicles.push(stopVisit);
				}
			}
		}

		vehicles.sort(function(a, b){
			if(a.VehicleID > b.VehicleID)
				return 1;
			if(a.VehicleID < b.VehicleID)
				return -1;
			if(a.Arrival.ExpectedArrivalTime > b.Arrival.ExpectedArrivalTime)
				return 1;
			if(b.Arrival.ExpectedArrivalTime < b.Arrival.ExpectedArrivalTime)
				return -1
			return 0;
		})

		var id;
		var outList = [];
		for(var i=0; i<vehicles.length; i++){
			var vehicle = vehicles[i];
			if(vehicle.VehicleID != id){
				id = vehicle.VehicleID;
				outList.push({
					VehicleID: id,
					Arrivals: []
				})
			}

			outList[outList.length-1].Arrivals.push(vehicle);

		}

		res.send(outList);
	})
}