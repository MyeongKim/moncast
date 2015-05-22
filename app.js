var path = require('path');

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser')
var io = require('socket.io').listen(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
// router
app.get('/', function (req, res) {
	res.render('index');
});

app.get('/new', function (req, res) {
	res.render('new');
});

app.post('/login', function (req, res){
	console.log("user login==" + "id : " + req.body.id + "pw : " + req.body.pw);
	res.end();
});

io.sockets.on('connection', function (socket) {


});


server.listen(4000);