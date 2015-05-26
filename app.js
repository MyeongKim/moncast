var path = require('path');
var fs = require('fs');

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
			var num = 
			res.render('main', {roomArray : result});
		} else{
			console.log("방이 하나도 없습니다.");
			res.render('main');
		}
	});
});

app.post('/makeRoom', function(req, res){
	var title_entered = req.body.title;
	var title = title_entered.trim().replace(/\s/g,'');
	var query = Room.find({});
	query.where('title', title);
	query.exec( function(err, result){
		if (err) return handleError(err);
		if (typeof result[0] !== 'undefined' ){
			console.log(" 방 이름 중복 ");
			console.log(result);
			res.end('already used title');
		} else{
			var room = new Room ({
				title : title,
				title_entered : title_entered,
				bj : req.session.userId
			});
			room.save(function(err, results){
						console.log(results);
						res.end("end");
			});
		}
	});
});

app.get('/room/:room_title', function(req, res){
	var title = req.params.room_title;
	var query = Room.find({});
	query.where('title', title);
	query.exec( function(err, result){
		if(err) return handleError(err);
		console.log(result);
		res.render('room', {title : req.params.room_title, title_entered : result[0].title_entered , name : req.session.userId, word : result[0].block});
	})
});

app.get('/emo/:num', function(req, res){
	var num = req.params.num;
	var path = './public/img/' + num+ '.png';
	var img = fs.readFileSync(path);
     res.writeHead(200, {'Content-Type': 'image/png' });
     res.end(img, 'binary');
});

app.get('/admin', function(req,res){
	res.render('admin');
});

// socket.io
var userInRooms = {};
var allUserId = {};
var numUsers = 0;

var url = require('url');
io.sockets.on('connection', function (socket) {

	var addedUser = false;
	socket.on('join:room', function(data){
		var roomId = data.roomId
		if (userInRooms[roomId] == undefined){
			userInRooms[roomId] = [];
		}
		console.log(data.name);
		if ( userInRooms[roomId].indexOf(data.name) > -1 ){
			console.log('duplicated connection');
			// var index = userInRooms[roomId].indexOf(data.name);
			// userInRooms[roomId].splice(index, 1);
			io.to(socket.id).emit('connect twice');
			// socket.disconnect();
			return;
		} else{
			socket.join('room' + data.roomId);
			userInRooms[roomId].push(data.name);
			allUserId[socket.id] = data.name;
			io.sockets.in('room'+roomId).emit('add user', userInRooms[roomId]);
			console.log(userInRooms[roomId]);
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

	// 로컬에선 확인 안됨
	// var userIp = socket.client.request.headers['x-forwarded-for'];
	// console.log("user Ip " + userIp+ "Connected");
	// var userId[socke.id];

	// var ns = url.parse(socket.handshake.url, true).query.ns;
	// if (!ns) {
	// 	socket.disconnect();
	// 	return;
	// }

	// console.log('connected ns: '+ns);
	// socket.join(ns);
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
