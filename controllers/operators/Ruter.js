var mongoose = require('mongoose');
var request = require('request');
var busStopModel = require('../../models/busStop');
var coordinator = require('coordinator');

var busStopsURL = "http://reisapi.ruter.no/Place/GetStopsRuter?json=true";
var stopVisitURL = "";
var stopsOnLineURL = "";
var operatorName = "Ruter";
var coordinateSystem = "utm";
var utmZone = 32;


exports.updateBusStops = function(){
	clearDB();
	
	request({
		url: busStopsURL,
		json: true
		}, function(error, response, busStopList){
			if(!error && response.statusCode === 200){
				for(var i = busStopList.length - 1; i >= 0; i--){
					saveToDB(busStopList[i]);
				}
			}
		}
	)
}

// Removes 
function clearDB(){
	console.log("clearing database");
	busStopModel.remove({Operator: operatorName}, function(err){
		console.log("cleared");
		if(err) 
			console.log(err);
		else
			console.log('collection removed: ' + operatorName);
	})
}

function saveToDB(busStop){
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


function convertToLatLong(X, Y){
	var converter = coordinator(coordinateSystem, 'latlong');
	return converter(Y, X, utmZone);
}