var path = require('path');

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
var session = require('express-session');

var io = require('socket.io').listen(server);

var User = require('./app/models/schema').User;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ resave: true,
                  saveUninitialized: true,
                  secret: 'uwotm8' }));

// router
app.get('/', function (req, res) {
	res.render('index');
});

app.get('/new', function (req, res) {
	res.render('new');
});

app.post('/login', function (req, res){
	var id = req.body.id;
	var pw = req.body.pw;
	console.log("user login    " + "id : " + id + "pw : " + pw);
	var query = User.findOne({});
	query.where('id', id);
	query.where('pw', pw);
	query.exec( function(err, result){
		if (err) return handleError(err);
		if (result){
			console.log("로그인 성공 ");
			req.session.userId = req.body.id;
			req.session.cookie.expires = false;
			res.end("yes");
		} else{
			console.log("데이터가 없습니다.");
			res.end("no");
		}
	});
});

app.get('/main',function (req, res){
	res.render('main');
})
io.sockets.on('connection', function (socket) {


});


server.listen(4000);

function userCheck(id,pw){
	var query = User.findOne({});
	query.where('id', id);
	query.where('pw', pw);
	query.exec( function(err, result){
		if (err) return handleError(err);
		if (result){
			console.log("로그인 성공 ");
		} else{
			console.log("데이터가 없습니다.");
		}
	});
	};
