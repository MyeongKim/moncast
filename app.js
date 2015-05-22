var path = require('path');

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

// router
app.get('/', function (req, res) {
	res.render('index');
});

io.sockets.on('connection', function (socket) {


});


server.listen(4000);