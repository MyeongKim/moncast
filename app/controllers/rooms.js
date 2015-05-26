var Room = require('../models/schema').Room;

exports.load_rooms = function (req, res){
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
};

exports.make_room = function(req, res){
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
				bj : req.session.userId,
				date : new Date
			});
			room.save(function(err, results){
						console.log(results);
						res.end("end");
			});
		}
	});
};

exports.get_room = function(req, res){
	var title = req.params.room_title;
	var query = Room.find({});
	query.where('title', title);
	query.exec( function(err, result){
		if(err) return handleError(err);
		console.log(result);
		res.render('room', {title : req.params.room_title, title_entered : result[0].title_entered , name : req.session.userId, word : result[0].block});
	})
};

