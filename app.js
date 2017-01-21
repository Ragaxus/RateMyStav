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
var dbImgs;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/stavs", function(err, newDB) {
	if(!err) {
		console.log("We are connected");
		dbImgs = newDB.collection("images");
		dbImgs.recordVote = function(imgID,vote) {
			var img = this.findOne({"_id": imgID},{avgRating: 1, N: {$size:
				"$votes"}});
			var N = img.N;
			var newAvgRating = (N*img.avgRating + vote.rating)/(N+1.0);
			this.images.update({"_id": imgID},{avgRating: newAvgRating, $push:{"votes":vote}});
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
		if (msg.command = "getImage") {
			dbImgs.aggregate([{$sample: {size: 1}},{$project:{"path":1}}], 
				function(err,aggr){
					var filPath =
						'./data/images/'+aggr[0].path;
					var ext = path.extname(filPath);
					var res = {};
					base64.encode(filPath,{string: true, local:
						true},function(err,result){
						res.img = "data:image/" + ext + ";base64," + result;
						ws.send(JSON.stringify(res));
						});
				});
		};
	});
});


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
