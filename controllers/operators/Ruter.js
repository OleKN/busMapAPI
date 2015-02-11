var mongoose = require('mongoose');
var request = require('request');
var busStopModel = require('../../models/busStop');
var busLineModel = require('../../models/busLine');
var coordinator = require('coordinator');
var _ = require('underscore');

var busStopsURL = "http://reisapi.ruter.no/Place/GetStopsRuter?json=true";
var busLinesURL = "http://reisapi.ruter.no/Line/GetLines?json=true";
var busStopsByLineURL = "http://reisapi.ruter.no/Line/GetStopsByLineID/"; // + ID + "?json=true"
var operatorName = "Ruter";
var coordinateSystem = "utm";
var utmZone = 32;


// TODO: use http://reisapi.ruter.no/Help/Api/GET-Meta-GetValidities
// to trigger updates

// Updates locations of bus stops, and stores them to the database
exports.updateBusStops = function(callback){
	// This step should be avoided in the future
	// It might be better to update existing values, rather than to clear and reinsert
	clearDB(busStopModel, function(err){
		if(err)
			return console.error(err);
		console.log("cleared db");
		request({
		url: busStopsURL,
		json: true
		}, function(error, response, busStopList){
			if(!error && response.statusCode === 200){
				var cb = _.after(busStopList.length, callback);
				for(var i = busStopList.length - 1; i >= 0; i--){
					saveStopToDB(busStopList[i], cb);

				}
			}
		})
	});
}

// Removes all bus stops from a given operator from the database
function clearDB(model, callback){
	model.remove({Operator: operatorName}, callback);
}

// Saves the bus stop to the database
function saveStopToDB(busStop, callback){
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
		if(err) 
			console.log(err);
		else
			callback();
	})
}

// Converts coordinates to LatLong
function convertToLatLong(X, Y){
	var converter = coordinator(coordinateSystem, 'latlong');
	return converter(Y, X, utmZone);
}

// Removes all existing bus lines from Ruter in the database, and fetches the new ones from their API
exports.updateBusLines = function(callback){
	clearDB(busLineModel, function(err){
		if(err) 
			return console.error(err);

		request({
		url: busLinesURL,
		json: true
		}, function(error, response, busLineList){
			if(!error && response.statusCode === 200){
				var cb = _.after(busLineList.length, callback);
				for(var i = busLineList.length - 1; i >= 0; i--){
					findBusStopsForLine(busLineList[i], cb);
				}
			}
		})
	});
}

// Finds all bus stops on a line by querying Ruter's API
function findBusStopsForLine(busLine, callback){
	request({
		url: busStopsByLineURL + busLine.ID + "?json=true",
		json: true
		}, function(error, response, busStopList){
			if(!error && response.statusCode === 200){
				saveLineToDB(busLine, busStopList, callback);
			}
		}
	)
}

// Saves bus line to the database, together with a list of stops they serve
function saveLineToDB(busLine, busStopList, callback){
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
		Transportation: busLine.Transportation,
		LastUpdated: new Date()
	});

	newBusLine.save(function(err, stored){
		if(err) 
			console.log(err);
		else
			callback();
	})
}