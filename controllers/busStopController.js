var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');

exports.getBusStops = function(req,res){
	var operatorParam = req.params.operator;

	busStopModel.find({Operator: operatorParam}, function(err, busStopList){
		if(err)
			return console.error(err);
		res.send(busStopList);
	})
}