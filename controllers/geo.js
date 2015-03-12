exports.toRadians = function(deg){
	return toRadians(deg);
}

function toRadians(deg){
	return deg * (Math.PI / 180);
}

exports.toDegrees = function(rad){
	return toDegrees(rad);
}

function toDegrees(rad){
	return rad * (180 / Math.PI);
}

// Calculates the distance between two lat/lng positions
exports.getDistance = function(pos1, pos2){
	var R = 6371000; // metres
	var φ1 = toRadians(previousPosition.Latitude);
	var φ2 = toRadians(nextPosition.Latitude);
	var λ1 = toRadians(previousPosition.Longitude);
	var λ2 = toRadians(nextPosition.Longitude);

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c;
}

// Calculates the angle between two lat/lng positions in degrees
exports.getBearing = function(pos1, pos2){
	var φ1 = toRadians(pos1.Latitude);
	var φ2 = toRadians(pos2.Latitude);
	var λ1 = toRadians(pos1.Longitude);
	var λ2 = toRadians(pos2.Longitude);

	var y = Math.sin(λ2 - λ1) * Math.cos(φ2);
	var x = Math.cos(φ1) * Math.sin(φ2) -
	        Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
	var deg = toDegrees(Math.atan2(y, x));
	return deg % 360;
}