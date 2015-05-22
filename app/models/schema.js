var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/node');

var userSchema = new mongoose.Schema({
	id : { type: String, unique: true},
	name : String,
	pw : String,
	tweet_id : [String]} , { collection : 'users'});

// compile to Model
var User = mongoose.model('User', userSchema);

module.exports = {
	User : User
};