var User = require('../models/schema').User;

exports.sign_up =  function (req, res){
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
			});
			res.end("yes");
		}
	});
};

exports.login = function (req, res){
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
};

