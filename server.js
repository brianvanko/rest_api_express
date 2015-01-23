var express    = require('express');		
var app        = express(); 				
var bodyParser = require('body-parser'); 	
var morgan     = require('morgan'); 		
var mongoose   = require('mongoose');
var User       = require('./app/models/user');
var port       = process.env.PORT || 8080; 
var jwt 	   = require('jsonwebtoken');

var superSecret = 'supersecretpassword';

//config
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});
 
app.use(morgan('dev'));

//connect to db
mongoose.connect('mongodb://localhost/user_crm'); 

//routes
//homepage
app.get('/', function(req, res) {
	res.send('Welcome to the home page!');
});

var apiRouter = express.Router();



apiRouter('/authenticat', function (req, res) {
	User.findOne({
		_id: req.body.username
	}).select('name username password').exec(function (err, user) {
		if (err) throw err;

		if (!user) {
			res.json({success: false, message: 'Authentication fails. User not found.'})
		} else if (user) {
			var validPassword = user.comparePassword(req.body.password);
			if (!validPassword) {
				res.json({success: false, message: 'Authentication failed. Wrong password.'})
			} else {
				var token = jwt.sign({
					name: user.name,
					username: user.username,
				}, superSecret, {
					expiresInMinutes: 1440
				});

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				})
			}
		}
	})
})

//api middleware
apiRouter.use(function(req, res, next) {

	console.log('Somebody just came to our app!');

	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	if (token) {
		jwt.verify(token, superSecret, function(err, decoded) {
			if (err) {
				return res.json({success: false, message: 'Failed to authenticate token.'})
			}

			req.decoded = decoded;
		});
	} else {
		return res.status(403).send({success: false, message: 'No token provided.'})
	}

	next(); 
});

// accessed from /api
apiRouter.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });	
});

// api users resource
apiRouter.route('/users')

	.post(function(req, res) {
		
		var user = new User();		
		user.name = req.body.name;  
		user.username = req.body.username;  
		user.password = req.body.password;  

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

	.get(function(req, res) {
		User.find(function(err, users) {
			if (err) return res.send(err);

			res.json(users);
		});
	});

apiRouter.route('/users/:user_id')

	.get(function(req, res) {
		User.findById(req.params.user_id, function(err, user) {
			if (err) return res.send(err);

			// return that user
			res.json(user);
		});
	})

	.put(function(req, res) {
		User.findById(req.params.user_id, function(err, user) {

			if (err) return res.send(err);

			// set the new user information if it exists in the request
			if (req.body.name) user.name = req.body.name;
			if (req.body.username) user.username = req.body.username;
			if (req.body.password) user.password = req.body.password;

			// save the user
			user.save(function(err) {
				if (err) return res.send(err);

				res.json({ message: 'User updated!' });
			});

		});
	})

	.delete(function(req, res) {
		User.remove({
			_id: req.params.user_id
		}, function(err, user) {
			if (err) return res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});

apiRouter.get('/me', function (req, res) {
	res.send(req.decoded);
})

//register api routes
app.use('/api', apiRouter);

//start the server
app.listen(port);
console.log('Magic happens on port ' + port);