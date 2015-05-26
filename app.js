var path = require('path');
var fs = require('fs');

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var params = require('express-params');


var User = require('./app/models/schema').User;
var Room = require('./app/models/schema').Room;
var users = require('./app/controllers/users.js');
var rooms = require('./app/controllers/rooms.js');

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
	// if (req.session.userId){
	// 	res.redirect('/main');
	// }
	res.render('index');
});

app.get('/logout', function(req, res){
	req.session.destroy();
	res.render('index');
});

app.get('/new', function (req, res) {
	res.render('new');
});

app.post('/new', users.sign_up);
app.post('/login', users.login);

app.get('/admin', function(req,res){
	res.render('admin');
});

app.post('/admin', function(req,res){
	var id = req.body.id;
	var pw = req.body.pw;
	if ( id == "admin" && pw == "admin"){
		res.end("yes");
	} else{
		res.end("no");
	}
});

app.get('/admin_main', function(req, res){
	var userData, roomData;
	var query1 = User.find({});
	query1.exec( function(err, userData){
		if (err) return handleError(err);
		userData = userData;
		var query2 = Room.find({});
		query2.exec( function(err, roomData){
			if (err) return handleError(err);
			roomData = roomData;
			res.render('admin_main', { userData : userData, roomData : roomData});
		}); 
	});
});

app.get('/main', rooms.load_rooms);
app.post('/makeRoom', rooms.make_room);
app.get('/room/:room_title', rooms.get_room);

app.get('/emo/:num', function(req, res){
	var num = req.params.num;
	var path = './public/img/' + num+ '.png';
	var img = fs.readFileSync(path);
     res.writeHead(200, {'Content-Type': 'image/png' });
     res.end(img, 'binary');
});

// socket.io
var userInRooms = {};
var allUserId = {};
var numUsers = 0;

var url = require('url');
io.sockets.on('connection', function (socket) {

	// 로컬에선 확인 안됨. 공통 아이피 사용시 유저 구분 방법
	// var userIp = socket.client.request.headers['x-forwarded-for'];
	// console.log("user Ip " + userIp+ "Connected");

	var addedUser = false;
	socket.on('join:room', function(data){
		var roomId = data.roomId
		if (userInRooms[roomId] == undefined){
			userInRooms[roomId] = [];
		}
		console.log(data.name);
		if ( userInRooms[roomId].indexOf(data.name) > -1 ){
			console.log('duplicated connection');
			io.to(socket.id).emit('connect twice');
			return;
		} else{
			var query = User.update({ name : data.name},  { $set: { date: new Date }});
			query.exec( function(err, roomData){
			if (err) return handleError(err);
				socket.join('room' + data.roomId);
				userInRooms[roomId].push(data.name);
				allUserId[socket.id] = data.name;
				io.sockets.in('room'+roomId).emit('add user', userInRooms[roomId]);
				console.log(userInRooms[roomId]);
			}); 
		}
	});

	socket.on('new message', function(obj){
		var query = Room.findOne({});
		query.where('title', obj.roomId);
		query.exec ( function(err, result){
			if (err) return handleError(err);
			var blockArray = result.block;
			var clear = true;
			for ( i = 0 ; i < blockArray.length ; i++){
				if (obj.msg.indexOf(blockArray[i]) > -1 ){
					io.sockets.to(socket.id).emit('message blocked');
					clear = false;
				}
			}
			if (clear){
				io.sockets.in('room'+obj.roomId).emit('new message', obj);
			}
		}); 
	});

	socket.on('blockWords', function(obj){
		var query = Room.update({ title : obj.roomId},  { $push: { block: obj.word }});
		query.exec( function(err, result){
			if(err) return handleError(err);
			console.log(result);
			io.sockets.in('room'+obj.roomId).emit('blockWords', obj);
		});
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
		for ( i = 0 ; i < Object.keys(userInRooms).length ; i++){
			var roomId = Object.keys(userInRooms)[i];
			var name = allUserId[socket.id];
			var index = userInRooms[roomId].indexOf(name);
			if ( index > -1){
				console.log(' user leaved room');
				userInRooms[roomId].splice(index, 1);
				if (userInRooms[roomId].length == 0){
					var query = Room.remove({});
					query.where('title', roomId);
					query.exec ( function(err, result){
						if (err) return handleError(err);
						console.log(result);
					});
				}
				io.sockets.in('room'+roomId).emit('user leaved', name);
				io.sockets.in('room'+roomId).emit('add user', userInRooms[roomId]);
			}
		};
		delete allUserId[socket.id];
	});
});

server.listen(4000);
