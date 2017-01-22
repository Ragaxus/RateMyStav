//IMPORT STATEMENTS

//Basic Express stuff
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var base64 = require('node-base64-image');
var app = express();

console.log("__dirname = " + __dirname);

//MongoDB
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var dbImgs;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/stavs", function(err, newDB) {
	if(!err) {
		console.log("We are connected");
		dbImgs = newDB.collection("images");
		dbImgs.recordVote = function(imgID,vote) {
			this.aggregate([
					{$match:{"_id":new ObjectID(imgID)}},
					{$project:{avgRating:1,N:{$size:"$votes"}}}
			]).next(function(err,img) {
				console.log(JSON.stringify(img));
				var N = img.N;
				var newAvgRating = (N*img.avgRating + parseInt(vote.rating))/(N+1.0);
				dbImgs.update({"_id":new ObjectID(imgID)},{"$set":{avgRating:
					newAvgRating},"$push":{"votes":vote}});
			});
		};
	}
	else console.log(err);
});


//WebSocket (Express-itized)
var expressWS = require('express-ws')(app);


var routes = require('./routes/index');
var users = require('./routes/users');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.ws('/stav_channel', function(ws, req) {
	ws.on('message', function(msg) {
		var msgObj = JSON.parse(msg);
		switch (msgObj.command) {
			case "getImage":
				sendImage(ws);
				break;
			case "castVote":
				console.log("received id from client: " + msgObj.id);
				dbImgs.recordVote(msgObj.id,msgObj.vote);
				sendImage(ws);
				break;
		}
	});
});

var sendImage = function(ws){ 
	dbImgs.aggregate([{$sample: {size: 1}},{$project:{"path":1}}], 
			function(err,results){
				var aggr=results[0];
				var filPath =
					'./data/images/'+aggr.path;
				var ext = path.extname(filPath);
				base64.encode(filPath,{string: true, local:
					true},function(err,result){
						var res = {};
						res.img = "data:image/" + ext + ";base64," + result;
						res.id = aggr._id.toString();
						console.log("Sending out id of "+res.id);
						ws.send(JSON.stringify(res));
					});
			});
};

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

app.listen(3001);

module.exports = app;
