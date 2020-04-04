const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const csrf = require('csurf');

const authRoutes = require('./routes/auth');
const User = require('./models/User');


require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI;
const app = express();
var store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

store.on('error', function(error) {
  console.log(error);
});

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: store,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))

app.use(csrf());
app.use(flash());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.get('/', async(req, res) => {

  if(req.session.isLoggedIn){
    const user = await User.findById(req.session.user._id);
    res.render('index', { name: user.name });
  }else {
    res.redirect('/login');
  }
});

app.use(authRoutes);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  app.listen(3000);
});


