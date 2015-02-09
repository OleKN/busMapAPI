var express = require('express');
var mongoose = require('mongoose');
var fs = require('fs');
var app = express();
var busStopController = require('./controllers/busStopController');

mongoose.connect('mongodb://localhost/busAPI');

var operatorList = [];

// Opens all operator configs, and updates their bus stops
// To add another Operator, just add the file to ./controllers/operators/
fs.readdirSync('./controllers/operators').forEach(function (file) {
  if(file.substr(-3) == '.js') {
      route = require('./controllers/operators/' + file);
      route.updateBusStops();
      operatorList.push(route);
  }
});



app.get('/', function (req, res) {
    res.send('Welcome to the Bus Map API, for real time estimates of bus locations around the world!');
})

// Returns a list of all bus stops from a bus operator
app.get('/Stops/getBusStops/:operator', busStopController.getBusStops);





var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
