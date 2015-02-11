var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var app = express();
var busStopController = require('./controllers/busStopController');
var busLocationController = require('./controllers/busLocationController');

mongoose.connect('mongodb://localhost/busAPI');

var operatorList = [];

/*
// Opens all operator configs, and updates their bus stops
// To add another Operator, just add the file to ./controllers/operators/
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
*/


app.get('/', function (req, res) {
    res.send('Welcome to the Bus Map API, for real time estimates of bus locations around the world!');
})

// Returns a list of all bus stops from a bus operator
app.get('/Stops/getBusStops/:operator', busStopController.getBusStops);
app.get('/Stops/getBusStopsOnLine/:operator/:lineID', busStopController.getBusStopsOnLine);
app.get('/Bus/getBusLocationByLine/:operator/:lineName', busLocationController.getBusLocationByLine);
app.get('/Bus/getBusLinesByOperator/:operator', busLocationController.getBusLinesByOperator);
// Returns the list of operators currently supported by the system
app.get('/getAvailableOperators/', getOperatorNames);




function getOperatorNames(req, res){
	var nameList = [];
	for(var i = operatorList.length - 1; i >= 0; i--){
		nameList.push(operatorList[i]);
	}
	res.send(nameList);
}



var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
