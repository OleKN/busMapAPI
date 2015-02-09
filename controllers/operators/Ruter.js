var mongoose = require('mongoose');
var request = require('request');

var busStopModel = require('../../models/busStop');

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


function clearDB(){
	busStopModel.remove({operator: operatorName}), function(err){
		if(err) 
			console.log(err);
		else
			console.log('collection removed: ' + operatorName);
	}
}

function saveToDB(busStop){
	// var pos = convertToLatLong(coordinateSystem, busStop.X, busStop.Y, utmZone);
	var newBusStop = new busStopModel({
		ID: busStop.ID,
		Name: busStop.Name,
		City: busStop.District,
		Position: {
			Latitude: busStop.X,
			Longitude: busStop.Y
		},
		Operator: operatorName,
		BusLines: [],
		LastUpdated: new Date()
	});
	newBusStop.save(function(err, stored){
		if(err) console.log(err);
	})
}