var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var app = express();
var busStopController = require('./controllers/busStopController');
var busLocationController = require('./controllers/busLocationController');

mongoose.connect('mongodb://localhost/busAPI');

var operatorList = [];
// Uncomment this to update the database
//updateAllOperators();


app.get('/', function (req, res) {
    res.send('Welcome to the Bus Map API, for real time estimates of bus locations around the world!');
})

// Returns a list of all bus stops from a bus operator
app.get('/Stops/getBusStops/:operator', busStopController.getBusStops);
// Returns a list of stops on a given line. This should be the order in which they are visited 
app.get('/Stops/getBusStopsOnLine/:operator/:lineID', busStopController.getBusStopsOnLine);
// Returns all bus stop visits, that have a valid vehicle. It is sorted by vehicleID and expected arrival time.
app.get('/Bus/getRealTimeLineInfo/:operator/:lineName', busLocationController.getRealTimeLineInfo);
// Returns a list of all bus lines provided by an operator
app.get('/Bus/getBusLinesByOperator/:operator', busLocationController.getBusLinesByOperator);
// Returns the list of operators currently supported by the system
app.get('/getAvailableOperators/', getOperatorNames);

// Starts the server
var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})




// Used to present which operators are available on the API
function getOperatorNames(req, res){
	var nameList = [];
	for(var i = operatorList.length - 1; i >= 0; i--){
		nameList.push(operatorList[i]);
	}
	res.send(nameList);
}

// Opens all operator configs, and updates their bus stops
// To add another Operator, just add the file to ./controllers/operators/
function updateAllOperators(){
  fs.readdirSync('./controllers/operators').forEach(function (file) {
    if(file.substr(-3) == '.js') {
        route = require('./controllers/operators/' + file);
        route.updateBusStops(function(){
          console.log("updated stops for " + file);
          route.updateBusLines(function(){
            console.log("updated lines for " + file);
          });
        });
        
        operatorList.push(route);
    }
  });
}