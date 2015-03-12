var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var app = express();
var busStopController = require('./controllers/busStopController');
var busLocationController = require('./controllers/busLocationController');

mongoose.connect('mongodb://localhost/busAPI');

var operatorList = [];
var args = process.argv.slice(2);
if(args[0] == "--updateDB")
  updateAllOperators();


app.get('/', function (req, res) {
    res.send('Welcome to the Bus Map API, for real time estimates of bus locations around the world!');
})

// Returns a list of all bus stops from a bus operator
app.get('/Stops/getBusStops/:operator', busStopController.getBusStops);
// Returns a list of stops on a given line. This should be the order in which they are visited 
app.get('/Stops/getBusStopsOnLine/:operator/:lineID', busStopController.getBusStopsOnLine);

app.get('/Stops/getBusLineInfo/:operator/:lineID', busStopController.getBusLineInfo);
// Returns all bus stop visits, that have a valid vehicle. It is sorted by vehicleID and expected arrival time.
app.get('/Bus/getRealTimeLineInfo/:operator/:lineID', busLocationController.getRealTimeLineInfo);
// Returns a list of all bus lines provided by an operator
app.get('/Bus/getBusLinesByOperator/:operator', busLocationController.getBusLinesByOperator);
// Returns a list of all arrivals for all buses on a line
app.get('/Bus/getBusArrivalsOnLine/:operator/:lineID', busLocationController.getBusArrivalsOnLine);
// Returns the positions of buses on a line
app.get('/Bus/getBusPositionsOnLine/:operator/:lineID', busLocationController.getBusPositionsOnLine);
// Returns the list of operators currently supported by the system
app.get('/getAvailableOperators/', getOperatorNames);



// Starts the server
var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Bus map API listening at http://%s:%s', host, port)
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
            /*route.removePolylines(function(){
              console.log("removed polylines for " + file);
            })*/
          });
        });
        
        operatorList.push(route);
    }
  });
}