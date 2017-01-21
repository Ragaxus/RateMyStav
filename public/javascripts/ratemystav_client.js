//open connection to server
var socket;
$(document).ready(function() {
	socket = new WebSocket("ws://localhost:3001/stav_channel");

	socket.onmessage = function(event) {
		var dataObj = JSON.parse(event.data);
		$('#stav').attr('src',dataObj.img);
	};
	socket.onopen = function(event) {
		socket.send({command:"getImage"});
	};

	$('#vote').click(function() {
		socket.send({command:"getImage"});
	});
});

