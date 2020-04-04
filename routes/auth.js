const express = require('express');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');

const router = express.Router();

const User = require('../models/User');

router.get('/login', (req, res) => {
	res.render('login', { flash: {} });
});

router.post('/login', async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res.render('login', {
				flash: { type: 'danger', message: 'User does not exists' },
			});
		}

		const passwordMatched = await bcrypt.compare(password, user.password);

		if (!passwordMatched) {
			return res.render('login', {
				flash: { type: 'danger', message: 'Password is incorrect' },
			});
		}

		req.session.isLoggedIn = true;
		req.session.user = user;

		req.session.save((err) => {
			if (err) return res.redirect('/login');

			res.redirect('/');
		});
	} catch (error) {
		console.log(error);
		res.redirect('/login');
	}
});

router.get('/register', (req, res) => {
	let error = req.flash('error');
	if (error.length > 0) {
		error = error[0];
	} else {
		error = null;
	}

	res.render('register', { errorMessage: error }, );
});

router.post(
	'/register',
	[
		check('name', 'Name cannot be empty').notEmpty(),
		check('password', 'Password must be atleast 8 characters long')
			.isLength({ min: 8 })
			.custom((password, { req }) => {
				if (password !== req.body.confirmpassword) {
					throw new Error('Passwords have to match');
				}
				return true;
			}),
		check('email', 'Not a valid email')
			.isEmail()
			.normalizeEmail()
			.custom(async (emailInput) => {
				const user = await User.findOne({ email: emailInput });
				if (user) {
					return Promise.reject('User with this email already exists');
				}
			}),
	],
	async (req, res) => {
		try {
			const { name, email, password } = req.body;

      const errors = validationResult(req);

      if(!errors.isEmpty()) {
        return res.render('register', {
          errorMessage: errors.array()[0].msg,
        });
      }

			const hashedPW = await bcrypt.hash(password, 12);

			const user = User({
				name,
				email,
				password: hashedPW,
			});

			await user.save();

      

			res.render('login', {
				flash: {
					type: 'success',
					message: 'Registration successfull. You can login',
				},
			});
		} catch (error) {
			console.log(error);
			res.redirect('/register');
		}
	}
);

router.post('/logout', (req, res) => {
	req.session.destroy((err) => {
		if (err) return console.log(err);
		res.redirect('/login');
	});
});

module.exports = router;
