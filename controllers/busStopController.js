var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');
var interStopPolylineModel = require('../models/interStopPolyline');
var polylineConverter = require('polyline');
var request = require('request');



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

		var polyline = getDirections(busLine, function(polyline){
			//console.log(polylineConverter.decode(polyline));
			//console.log(polyline);
			busLine.Polyline = polyline;
			res.send(busLine);
		});


	})
}

// Creates an encoded polyline for a line
function getDirections(busLine, callback){
	if(busLine.StopVisits == null){
		// Update stopVisits in busLocationController
		console.log("Empty!");
		return null;
	}

	// find origin and destination in StopVisit list
	findBusStopOnLine(busLine.Operator, busLine.LineID, function(busStopList){
		if(busStopList.length < 2)
			return null;

		//var polyline = "";
		var polylinePoints = [];
		
		// This function ensures that the polylines are added in order
		var addPolylineSnippet = function(previousStop, nextStop){
			if(previousStop!=null && nextStop!=null){
				findPolylineBetweenStops(previousStop, nextStop, function(polylineSnippet){
					var converted = polylineConverter.decode(polylineSnippet);
					polylinePoints = polylinePoints.concat(converted);
					/*if(polyline != ""){
						var points = polylineConverter.decode(polylineSnippet);
						var firstPoint = polylineConverter.encode(points[0]);
						console.log(firstPoint);
						polylineSnippet.slice(firstPoint.length);
					}
					
					polyline += polylineSnippet;*/
					addPolylineSnippet(nextStop, busStopList.pop());
				})
			}else{
				//console.log(polylinePoints);
				callback(polylineConverter.encode(polylinePoints));
			}
		}
		// takes the first and second and sends them to the function
		addPolylineSnippet(busStopList.pop(), busStopList.pop());
	})	
}

function findPolylineBetweenStops(busStopA, busStopB, callback){
	interStopPolylineModel.findOne({PreviousStopID: busStopA.ID, NextStopID: busStopB.ID}, function(err, interStopPolyline){
		if(err){
			console.log(err);
		}else if(!interStopPolyline){
			getDirectionsFromGoogle(busStopA, busStopB, function(directions){

				interStopPolyline = createPolylineObject(busStopA, busStopB, directions);

				saveInterStopPolylineToDB(interStopPolyline);

				callback(interStopPolyline.Polyline)

			});
		}else{
			callback(interStopPolyline.Polyline);
		}
	});
}

// Finds the locations of the two bus stops and connects them through the Google Directions API
function getDirectionsFromGoogle(previousStop, nextStop, callback){
	var key = "AIzaSyDr2_0MXNJJuP0t7sH7qIdNPCDUsY7GUok";

	var origin = "(" + previousStop.Position.Latitude + "," + previousStop.Position.Longitude + ")";
	var destination = "(" + nextStop.Position.Latitude + "," + nextStop.Position.Longitude + ")";
	var URL =  'https://maps.googleapis.com/maps/api/directions/json?origin=' + origin +'&destination=' + destination + '&key=' + key;
	request({
	url: URL,
	json: true
	}, function(error, response, directions){
		if(!error && response.statusCode === 200){
			callback(directions);
		}else{
			callback(null);
		}
	})
}

function createPolylineObject(previousStop, nextStop, directions){
	// Reformats and trims the legs of the trip
	var legs = [];
	if(!directions){
		console.log("DIRECTIONS NOT FOUND!");
		return null;
	}
	if(directions.routes[0] == null || directions.routes[0].legs == null){
		console.log("Error fetching directions");
		console.log(directions);
		return null;
	}
	for(var i = 0; i < directions.routes[0].legs.length; i++){
		var leg = directions.routes[0].legs[i];
		var steps = [];

		for(var j = 0; j < leg.steps.length; j++){
			var step = leg.steps[j];
			steps.push({
				Distance: step.distance.value,
				Polyline: step.polyline.points,
				Start_location: {
					Latitude: step.start_location.lat,
					Longitude: step.start_location.lng
				},
				End_location: {
					Latitude: step.end_location.lat,
					Longitude: step.end_location.lng
				}
			})
		}

		legs.push({
			Distance: leg.distance.value,
			Start_location: {
				Latitude: leg.start_location.lat,
				Longitude: leg.start_location.lng
			},
			End_location: {
				Latitude: leg.end_location.lat,
				Longitude: leg.end_location.lng
			},
			Steps: steps
		});
	}

	// Creates the interStopPolyline JSON
	interStopPolyline = new interStopPolylineModel({
		PreviousStopID: previousStop.ID,
		NextStopID: nextStop.ID,
		Polyline: directions.routes[0].overview_polyline.points,
		Bounds: directions.routes[0].bounds,
		Legs: legs
	})

	return interStopPolyline;
}

function saveInterStopPolylineToDB(interStopPolyline){
	interStopPolyline.save(function(err, stored){
		if(err){
			console.log(err);
		}
	});
}