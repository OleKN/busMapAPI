var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');
var busStopController = require('./busStopController');
var request = require('request');
var geo = require('./geo');
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

	getAllStopVisitsForRoute(operatorParam, lineIDParam, function(arrivalsList, err){
		console.log("Something came back");
		if(err){
			console.log(err);
			res.send("Error: unable to find route");
		}else{
			res.send(arrivalsList);
		}
	})
	
}

function getAllStopVisitsForRoute(operator, lineID, callback){
	// Look for bus stops for a given line
	busLineModel.findOne({Operator: operator, LineID: lineID})
	.exec(function(err, busLine){
		// check for errors in response from DB
		if(err) {
			callback([], err);
			return null;
		} else if(!busLine){
			callback([], "No busLineID: " + lineID + " found for operator: " + operator);
			return null;
		}

		//var busLine = busLines[0];
		lineName = busLine.Name;
		
		var busStopIDs = busLine.BusStops;
		var arrivalsList = [];
		
		// Function that will be called after every bus stop on that line has been queried for arrivals
		var cb = _.after(busStopIDs.length, function(arrivalsList){
			callback(arrivalsList);
		});

		// Ask for bus stop visits for every bus stop for a given line
		for(var i = 0; i < busStopIDs.length; i++){
			getStopVisitsOnStop(operator, busStopIDs[i], lineName, function(stopVisit){
				if(stopVisit != null)
					arrivalsList.push(stopVisit);
				cb(arrivalsList);
			})
		}
	})
}


exports.getStopVisitsOnStop = function(req, res){
	var operator = req.params.operator;
	var stopID = req.params.stopID;
	var lineID = req.params.lineID;

	busLineModel.findOne({Operator: operator, LineID: lineID}, function(err, busLine){
		getStopVisitsOnStop(operator, stopID, busLine.Name, function(stopVisits){
			res.send(stopVisits);
		});
	});
}

function getStopVisitsOnStop(operator, stopID, lineName, callback){
	busStopModel.findOne({ID: stopID, Operator: operator} , function(err, busStop){
		if(err || busStop ==null){
			console.error(err);
			console.log("Error for busStop: " + busStop);
			callback(null);
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
						callback(newStopVisitJSON);
					}else{
						console.error(error);
					}
				}
			)
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
			VisitNumber: visit.MonitoredVehicleJourney.MonitoredCall.VisitNumber,
			AimedArrivalTime: visit.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime,
			ExpectedArrivalTime: visit.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime,
			ExpectedArrivalTimeMS: new Date(visit.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime).getTime(),
			AimedDepartureTime: visit.MonitoredVehicleJourney.MonitoredCall.AimedDepartureTime,
			ExpectedDepartureTime: visit.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime
		}
	}
}

exports.getBusArrivalsOnLine = function(req, res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;
	getArrivals(operatorParam, lineIDParam, function(arrivals, err){
		if(err){
			console.log(err);
			res.send("Error: unable to find route");
		}

		console.log("Length = " + arrivals.length);
		var cb = _.after(arrivals.length, function(){
			console.log("callback called");
			res.send(arrivals);
		})



		// GetBusLineInfo
		busLineModel.findOne({Operator: operatorParam , LineID: lineIDParam}, function(err, busLine){
			var transportation = busLine.Transportation;

			var stopVisits = busLine.StopVisits;
			if(err)
				return console.error(err);
			for(var i=0; i < arrivals.length; i++){
				arrivals[i].Transportation = transportation;
				for(var j=0; j < stopVisits.length; j++){

					(function(arrival, stopVisit, index){

						var nextStopID = arrival.Arrivals[0].BusStopID;
						var direction = arrival.Arrivals[0].Direction;
						if(stopVisit.BusStopID == nextStopID && stopVisit.Direction == direction){
							if(stopVisit.PreviousStopID != null){
								var timeOfArrival = new Date(arrival.Arrivals[0].Arrival.ExpectedArrivalTime);
								
								//CHANGE TIMEZONE OF THIS SHIT!
								var previousTimeOfArrival = new Date(timeOfArrival.getTime() - stopVisit.TimeSinceLast);

								busStopModel.findOne({Operator: operatorParam, ID: stopVisit.PreviousStopID}, function(err, previousBusStop){
									arrivals[index].Arrivals.unshift({
										Guess: true,
										VehicleID: arrival.Arrivals[0].VehicleID,
										LineID: arrival.Arrivals[0].LineID,
										LineName: arrival.Arrivals[0].LineName,
										OriginID: arrival.Arrivals[0].OriginID,
										OriginName: arrival.Arrivals[0].OriginName,
										DestinationID: arrival.Arrivals[0].DestinationID,
										DestinationName: arrival.Arrivals[0].DestinationName,
										Arrival: {
											VisitNumber: -1,
											AimedArrivalTime: previousTimeOfArrival,
											ExpectedArrivalTime: previousTimeOfArrival,
											ExpectedArrivalTimeMS: previousTimeOfArrival.getTime(),
											AimedDepartureTime: previousTimeOfArrival,
											ExpectedDepartureTime: previousTimeOfArrival
										},
										BusStopID: previousBusStop.ID,
										BusStopName: previousBusStop.Name,
										BusStopPosition: previousBusStop.Position
									});
									console.log("c");
									cb();
								})
							}else{console.log("c2"); cb();}
						}
					})(arrivals[i], stopVisits[j], i);
				}
			}

			//res.send(arrivals);
		})


		
	});
}

function getArrivals(operatorParam, lineIDParam, callback){
	getAllStopVisitsForRoute(operatorParam, lineIDParam, function(arrivalsList, err){
		if(err){
			callback([], err);
			return null;
		}
		var vehicles = [];

		for(var i = 0; i < arrivalsList.length; i++){
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
			if(a.Arrival.AimedArrivalTime > b.Arrival.AimedArrivalTime)
				return 1;
			if(b.Arrival.AimedArrivalTime < b.Arrival.AimedArrivalTime)
				return -1;
			if(a.Arrival.ExpectedArrivalTime > b.Arrival.ExpectedArrivalTime)
				return 1;
			if(a.Arrival.ExpectedArrivalTime < b.Arrival.ExpectedArrivalTime)
				return -1
			if(a.Arrival.VisitNumber > b.Arrival.VisitNumber)
				return 1;
			if(a.Arrival.VisitNumber < b.Arrival.VisitNumber)
				return -1;
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
		orderBusStopListForLine(outList, function(){
			callback(outList);
		});		
	})
}

exports.getBusPositionsOnLine = function(req, res){
	var operatorParam = req.params.operator;
	var lineIDParam = req.params.lineID;



	getArrivals(operatorParam, lineIDParam, function(arrivals, err){
		if(err){
			console.log(err);
			res.send("Error: Unable to find line");
		}
		busLineModel.findOne({Operator: operatorParam, LineID: lineIDParam}, function(err, busLine){
			console.log("Arrivals: " + arrivals);
			var buses = [];
			var cb = _.after(arrivals.length, function(){
				res.send(buses);
			});
			var transportation = busLine.Transportation;
			var outList = [];
			for(var i = 0; i < arrivals.length; i++){
				nextStop = arrivals[i].Arrivals[0];
				var stopVisit = findStopVisitOnRoute(busLine.StopVisits, nextStop);

				(function(currentStopVisit){
					if(currentStopVisit!=null){
						busStopModel.findOne({Operator: operatorParam, ID: currentStopVisit.PreviousStopID}, function(err, previousBusStop){
							currentStopVisit.Transportation = transportation;
							if(err){ 
								console.log(err);
							}else if(previousBusStop == null){
								buses.push(currentStopVisit);
							}else{
								var previousPosition = previousBusStop.Position;
								var nextPosition = currentStopVisit.Position;
								
								var arrivalDate = new Date(currentStopVisit.NextBusStopArrival);
								var currentDate = new Date();
								var multiplicator = (arrivalDate.getTime() - currentDate.getTime()) / currentStopVisit.TimeSinceLast;
								

								if(multiplicator > 1){
									multiplicator = 1;
								}else if(multiplicator < 0){
									multiplicator = 0;
								}

								var position = {
									Latitude: previousPosition.Latitude + (nextPosition.Latitude - previousPosition.Latitude) * multiplicator,
									Longitude: previousPosition.Longitude + (nextPosition.Longitude - previousPosition.Longitude) * multiplicator
								}
								
								// Calculate bearing (in radians)
								currentStopVisit.Bearing = geo.getBearing(previousPosition, nextPosition);

								currentStopVisit.Position.Longitude = position.Longitude;
								currentStopVisit.Position.Latitude = position.Latitude;

								buses.push(currentStopVisit);


							}
							cb();
						})
					}else{
						cb();
					}
				})(stopVisit);


			}
		});
	})
}

function findStopVisitOnRoute(stopVisits, arrival){
	for(var i = 0; i < stopVisits.length; i++){
		var stopVisit = JSON.parse(JSON.stringify(stopVisits[i]));

		if(arrival.BusStopID == stopVisit.BusStopID
				&& arrival.Direction == stopVisit.Direction
				&& arrival.DestinationID == stopVisit.DestinationID
				&& arrival.DestinationName == stopVisit.DestinationName){
			return {
				VehicleID: arrival.VehicleID,
				LineID: arrival.LineID,
				LineName: arrival.LineName,
				NextBusStopName: arrival.BusStopName,
				NextBusStopID: arrival.BusStopID,
				BusStopID: arrival.BusStopID,
				NextBusStopArrival: arrival.Arrival.ExpectedArrivalTime,
				ExpectedArrivalTime: arrival.Arrival.ExpectedArrivalTime,
				ExpectedArrivalTimeMS: arrival.Arrival.ExpectedArrivalTime.getTime(),
				Position: arrival.BusStopPosition,
				DestinationName: arrival.DestinationName,
				DestinationBusStopID: arrival.DestinationID,
				DestinationArrival: "null",
				PreviousStopID: stopVisit.PreviousStopID,
				TimeSinceLast: stopVisit.TimeSinceLast
			}
		}
	}
	return null;
}


// Function that will ensure that the bus stops 
// listed for a given route are in the correct order
// It will also attempt to determine the time between the stops
function orderBusStopListForLine(busList, callback){
	var stopsList = [];
	// Direction, BusStopID, AimedArrivalTime

	var lineID = -1;
	for(var i = 0; i < busList.length; i++){
		var arrivals = busList[i].Arrivals;
		var lastStop = null;
		for(var j = 0; j < arrivals.length; j++){
			arrival = arrivals[j];
			lineID = arrival.LineID;

			if(lastStop != null && lastStop.Direction == arrival.Direction && (lastStop.DestinationName == arrival.DestinationName || lastStop.DestinationName == arrival.BusStopName || lastStop.DestinationID == arrival.BusStopID)){
				stopsList.push({
					BusStopID: arrival.BusStopID,
					TimeSinceLast: Math.abs(new Date(arrival.Arrival.AimedArrivalTime).getTime() - new Date(lastStop.AimedArrivalTime).getTime()),
					PreviousStopID: lastStop.BusStopID,
					Direction: arrival.Direction,
					DestinationID: arrival.DestinationID,
					DestinationName: arrival.DestinationName
				})
			}else{
				stopsList.push({
					BusStopID: arrival.BusStopID,
					TimeSinceLast: null,
					PreviousStopID: null,
					Direction: arrival.Direction,
					DestinationID: arrival.DestinationID,
					DestinationName: arrival.DestinationName
				})
			}

			lastStop = ({
				BusStopID: arrival.BusStopID,
				VehicleID: arrival.VehicleID,
				AimedArrivalTime: arrival.Arrival.AimedArrivalTime,
				ExpectedArrivalTime: arrival.Arrival.ExpectedArrivalTime,
				AimedDepartureTime: arrival.Arrival.AimedDepartureTime,
				ExpectedDepartureTime: arrival.Arrival.ExpectedDepartureTime,
				Direction: arrival.Direction,
				DestinationID: arrival.DestinationID,
				DestinationName: arrival.DestinationName
			})
		}
	}

	updateArrivalTimesInDB(lineID, stopsList, callback);
}

function updateArrivalTimesInDB(lineID, newStopsList, callback){
	busLineModel.findOne({LineID: lineID} , function(err, busLine){
		var stopVisits = [];
		if(err){
			console.log(err);
		}
		var stopVisits = [];
		if(busLine != null){
			stopVisits = busLine.StopVisits;
		}
		
		for(var i=0; i < newStopsList.length; i++){
			newStop = newStopsList[i];
			var existingStopVisit = getExistingBusStopInList(stopVisits, newStop);

			if(existingStopVisit == null){
				stopVisits.push(newStop);

			}else if(existingStopVisit.Stop.PreviousStopID == null){
				existingStopVisit.Stop.PreviousStopID = newStop.PreviousStopID;
				existingStopVisit.Stop.TimeSinceLast = newStop.TimeSinceLast;
				stopVisits[existingStopVisit.Index] = existingStopVisit.Stop;

			}else if(existingStopVisit.Stop.TimeSinceLast == null){
				existingStopVisit.Stop.TimeSinceLast = newStop.TimeSinceLast;
				stopVisits[existingStopVisit.Index] = existingStopVisit.Stop;
			}else if(existingStopVisit.Stop.TimeSinceLast != newStop.TimeSinceLast ||
					existingStopVisit.Stop.PreviousStopID != newStop.PreviousStopID ||
					existingStopVisit.Stop.DestinationID != newStop.DestinationID){


				// There is an issue here when two stops in a row are listed with the same arrival times. 
				// It is thereby close to impossible to determine the order of these stops 
				// One might incorporate a fix using the positions of the stops and some clever pathfinding, 
				// but this will have to do for now.

				// Another bug is that end stops are not listed with previous stops
				console.log("Duplicates found when updating arrival times");
			}			
		}


		// Store new values to database
		if(busLine != null){
			busLineModel.update({LineID: busLine.LineID}, {"$set": {StopVisits: stopVisits}}, {upsert: true}, function(err, doc){
				if(err) console.log(err);
				callback();
			});
		}
	})	
}

function getExistingBusStopInList(busStopList, busStop){
	for(var i = busStopList.length - 1; i >= 0; i--){
		var currentStop = busStopList[i];
		if(currentStop.BusStopID == busStop.BusStopID 
			&& currentStop.Direction == busStop.Direction 
			&& currentStop.DestinationID == busStop.DestinationID
			&& currentStop.DestinationName == busStop.DestinationName){
			return {
				Stop: currentStop, 
				Index: i
			};
		}
	}
	return null;
}