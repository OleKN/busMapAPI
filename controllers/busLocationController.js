var mongoose = require('mongoose');
var busStopModel = require('../models/busStop');
var busLineModel = require('../models/busLine');

exports.getBusLocationByLine = function(req, res){
	// Get all bus stops
}

exports.getBusLinesByOperator = function(req, res){
	var operatorParam = req.params.operator;

	busLineModel.find({Operator: operatorParam}, function(err, busLineList){
		if(err)
			return console.error(err);
		res.send(busLineList);
	})
}