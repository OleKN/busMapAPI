var mongoose = require('mongoose');
var request = require('request');
var busStopModel = require('../../models/busStop');
var busLineModel = require('../../models/busLine');
var coordinator = require('coordinator');

var busStopsURL = "http://reisapi.ruter.no/Place/GetStopsRuter?json=true";
var busLinesURL = "http://reisapi.ruter.no/Line/GetLines?json=true";
var busStopsByLineURL = "http://reisapi.ruter.no/Line/GetStopsByLineID/"; // + ID + "?json=true"
var operatorName = "Ruter";
var coordinateSystem = "utm";
var utmZone = 32;

// Updates locations of bus stops, and stores them to the database
exports.updateBusStops = function(){
	// This step should be avoided in the future
	// It might be better to update existing values, rather than to clear and reinsert
	clearDB(busStopModel);
	
	request({
		url: busStopsURL,
		json: true
		}, function(error, response, busStopList){
			if(!error && response.statusCode === 200){
				for(var i = busStopList.length - 1; i >= 0; i--){
					saveStopToDB(busStopList[i]);
				}
			}
		}
	)
}

// Removes all bus stops from a given operator from the database
function clearDB(model){
	model.remove({Operator: operatorName}, function(err){
		if(err) 
			console.log(err);
		else
			console.log('Collection removed for: ' + operatorName);
	})
}

// Saves the bus stop to the database
function saveStopToDB(busStop){
	var pos = convertToLatLong(busStop.X, busStop.Y);

	var newBusStop = new busStopModel({
		ID: busStop.ID,
		Name: busStop.Name,
		City: busStop.District,
		Position: {
			Latitude: pos.latitude,
			Longitude: pos.longitude
		},
		Operator: operatorName,
		BusLines: [],
		LastUpdated: new Date()
	});

	newBusStop.save(function(err, stored){
		if(err) console.log(err);
	})
}

// Converts coordinates to LatLong
function convertToLatLong(X, Y){
	var converter = coordinator(coordinateSystem, 'latlong');
	return converter(Y, X, utmZone);
}

// Removes all existing bus lines from Ruter in the database, and fetches the new ones from their API
exports.updateBusLines = function(){
	clearDB(busLineModel);

	request({
		url: busLinesURL,
		json: true
		}, function(error, response, busLineList){
			if(!error && response.statusCode === 200){
				for(var i = busLineList.length - 1; i >= 0; i--){

					findBusStopsForLine(busLineList[i]);
				}
			}
		}

	)
}

// Finds all bus stops on a line by querying Ruter's API
function findBusStopsForLine(busLine){
	request({
		url: busStopsByLineURL + busLine.ID + "?json=true",
		json: true
		}, function(error, response, busStopList){
			if(!error && response.statusCode === 200){
				saveLineToDB(busLine, busStopList);
			}
		}
	)
}

// Saves bus line to the database, together with a list of stops they serve
function saveLineToDB(busLine, busStopList){
	var busStopIDList = [];
	for(var i = 0; i < busStopList.length; i++){
		busStopIDList.push(busStopList[i].ID);
	}

	var newBusLine = new busLineModel({
		LineID: busLine.ID,
		Name: busLine.Name,
		LineColor: busLine.LineColour,
		Operator: operatorName,
		BusStops: busStopIDList,
		LastUpdated: new Date()
	});

	newBusLine.save(function(err, stored){
		if(err) 
			console.log(err);
	})
}