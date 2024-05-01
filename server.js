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
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const serverSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
});

// Modellek létrehozása
const User = mongoose.model('User', userSchema);
const Server = mongoose.model('Server', serverSchema);

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
  // ... (Ugyanaz a bejelentkezési logika, mint a korábbi példában)
});

app.post('/register', async (req, res) => {
  // ... (Ugyanaz a regisztrációs logika, mint a korábbi példában)
});

// Ellenőrzés, hogy a felhasználó be van-e jelentkezve
app.use((req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
});

// Felhasználó profilja
app.get('/profile/:userId', async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // ... (Adatok lekérdezése és megjelenítése a profilhoz)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message
