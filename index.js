require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [
    {
      description: String,
      duration: Number,
      date: String
    }
  ]
});

const User = mongoose.model('User', userSchema);

// Create User
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({
      username: req.body.username
    });

    const savedUser = await user.save();

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// Get All Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');

    res.json(users);

  } catch (err) {
    res.json({ error: err.message });
  }
});

// Add Exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;

    const user = await User.findById(req.params._id);

    if (!user) {
      return res.json({ error: 'User not found' });
    }

    const exerciseDate = date
      ? new Date(date)
      : new Date();

    const exercise = {
      description,
      duration: Number(duration),
      date: exerciseDate.toDateString()
    };

    user.log.push(exercise);

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date,
      duration: exercise.duration,
      description: exercise.description
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

// Get Exercise Logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);

    if (!user) {
      return res.json({ error: 'User not found' });
    }

    let logs = user.log;

    const { from, to, limit } = req.query;

    // Filter by "from" date
    if (from) {
      logs = logs.filter(
        log => new Date(log.date) >= new Date(from)
      );
    }

    // Filter by "to" date
    if (to) {
      logs = logs.filter(
        log => new Date(log.date) <= new Date(to)
      );
    }

    // Limit results
    if (limit) {
      logs = logs.slice(0, Number(limit));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});