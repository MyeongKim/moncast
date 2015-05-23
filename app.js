var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var params = require('express-params');


var User = require('./app/models/schema').User;
var Room = require('./app/models/schema').Room;

var app = express();
params.extend(app);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

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

app.post('/new', function (req, res){
	var id = req.body.id;
	var pw = req.body.pw;
	console.log("new id  " + "id : " + id + "pw : " + pw);
	var query = User.findOne({});
	query.where('id', id);
	query.exec( function(err, result){
		if (err) return handleError(err);
		if (result){
			console.log("이미 존재하는 아이디 ")
			res.end("no");
		} else{
			console.log("아이디를 새로 생성합니다. ");
			var user1 = new User ({
				id : id,
				name : id,
				pw : pw
			});

			user1.save(function(err, results){
				console.log(results);
			})
			res.end("yes");
		}
	});
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
	var query = Room.find({});
	query.exec( function(err, result){
		if (err) return handleError(err);
		if (result){
			console.log("방 목록 가져오기 ");
			// req.session.userId
			console.log(result);
			res.render('main', {roomArray : result});
		} else{
			console.log("방이 하나도 없습니다.");
			res.render('main');
		}
	});
	
});

app.post('/makeRoom', function(req, res){
	var title = req.body.title;
	var room = new Room ({
		title : title,
		bj : req.session.userId
	});
	room.save(function(err, results){
				console.log(results);
				res.end("end");
	});
});

app.get('/room/:room_title', function(req, res){
	res.render('room', {title : req.params.room_title, name : req.session.userId});
});

app.get('/admin', function(req,res){
	res.render('admin');
});


//after redis
var userId = {};

io.sockets.on('connection', function (socket) {
	// 로컬에선 확인 안됨
	// var userIp = socket.client.request.headers['x-forwarded-for'];
	// console.log("user Ip " + userIp+ "Connected");
	// var userId[socke.id]

	if (!socket.handshake.query.title) {
				socket.disconnect();
				return;
		}
		// for (var id in usertags) {
		// 		if (usertags[id] === socket.handshake.query.tag) {
		// 				socket.disconnect();
		// 				return;
		// 		}
		// }


		var title = socket.handshake.query.title.trim().replace(/\s/g,'');
		title = title.substr(0, 10);
		console.log('title : ' + title);

		var name = socket.handshake.query.name;
		console.log('name : ' + name);

		socket.on('new message', function(msg){
			console.log(msg);
			io.emit('new message', {"msg" : msg, "userId" : name })
		});


});

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

server.listen(4000);
