//import packages
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var port = process.env.PORT || 3000;
var User       = require('./models/user');

//config and middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
	next();
});

app.use(morgan('dev'));

//connect to db
mongoose.connect('INSERT DB PATH');

//routes
app.get('/', function (req, res) {
	res.send('Welcome to our homepage');
});

	var apiRouter = express.Router();

	apiRouter.use(function (req, res, next) {
		console.log('you just hit our api');
		next();
	});

	apiRouter.route('/users')

	.post(function(req, res) {
		
		var user = new User();		// create a new instance of the User model
		user.name = req.body.name;  // set the users name (comes from the request)
		user.username = req.body.username;  // set the users username (comes from the request)
		user.password = req.body.password;  // set the users password (comes from the request)

		user.save(function(err) {
			if (err) {
				// duplicate entry
				if (err.code == 11000) 
					return res.json({ success: false, message: 'A user with that username already exists. '});
				else 
					return res.send(err);
			}

			// return a message
			res.json({ message: 'User created!' });
		});

	})

	.get(function (req, res) {
		User.find(function (err, users) {
			if (err) return res.send(err);

			res.json(users);
		});
	});

	//for users with route user/:id
	apiRouter.route('/users/:user_id')
		.get(function (req, res) {
			User.findById(req.params.user_id, function (err, user) {
				if (err) return res.send(err);
				res.json(user);
			});
		})
		.put(function (req, res) {
			User.findById(req.params.user_id, function (err, user) {
				if (err) return res.send(err);

				if (req.body.name) user.name = req.body.name;
				if (req.body.username) user.username = req.body.username;
				if (req.body.password) user.password = req.body.password;

				user.save(function (err){
					if (err) return res.send(err);

					res.json({message: 'User updated'});
				});
			})
		})
		.delete(function (req,res) {
			User.remove({
				_id: req.params.user_id
			}, function (err, user) {
				if (err) return res.send(err);

				res.json({message: 'User deleted'});
			});
		});


app.use('/api', apiRouter);

//connect to server
app.listen(port);
console.log('listening on port ' + port);