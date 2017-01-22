//open connection to server
var socket;
var currID;
$(document).ready(function() {
	socket = new WebSocket("ws://localhost:3001/stav_channel");
	socket.sendObj = function(obj) { this.send(JSON.stringify(obj)); };
	socket.onmessage = function(event) {
		var dataObj = JSON.parse(event.data);
		$('#stav').attr('src',dataObj.img);
		currID = dataObj.id;
	};
	socket.onopen = function(event) {
		socket.sendObj({"command":"getImage"});
	};

	$('#vote').click(function() {
		socket.sendObj({"command":"getImage"});
	});

	$('#divRating span').click(function() {
		var req = {};
		req.id = currID;
		req.vote = {};
		req.vote.rating = $(this).attr('id');
		req.command = "castVote";
		socket.sendObj(req);
	});

});

