const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const http = require('http');

// Adatbázis beállítása
const dbName = 'chat-app';
const uri = `mongodb://localhost:27017/${dbName}`;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Séma definiálása
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Modellek létrehozása
const User = mongoose.model('User', userSchema);

// Middleware-ek beállítása
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

// Hitelesítés
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid username or password' });
    req.session.userId = user._id;
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Username already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Ellenőrzés, hogy a felhasználó be van-e jelentkezve
app.use((req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
});

// Szerverek kezelése
const Server = mongoose.model('Server', {
  name: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:
