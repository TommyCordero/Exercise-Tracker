const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
console.log(JSON.stringify(String(process.env.MONGO_URI).slice(0, 30)))
console.log('length:', String(process.env.MONGO_URI).length)

const mongoose = require('mongoose')

mongoose.connect('mongodb://tommy09cordero_db_user:12345tommy@ac-yc5nyzf-shard-00-00.iwqn1rl.mongodb.net:27017,ac-yc5nyzf-shard-00-01.iwqn1rl.mongodb.net:27017,ac-yc5nyzf-shard-00-02.iwqn1rl.mongodb.net:27017/exercisedb?authSource=admin&replicaSet=atlas-4hl5on-shard-0&appName=Cluster0&ssl=true', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Connection error:', err.message))

const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  log: [{ description: String, duration: Number, date: Date }]
}))

app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Create a user
app.post('/api/users', async (req, res) => {
  const user = await User.create({ username: req.body.username })
  res.json({ username: user.username, _id: user._id })
})

// List all users
app.get('/api/users', async (req, res) => {
  const users = await User.find().select('username _id')
  res.json(users)
})

// Add an exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findById(req.params._id)
  const { description, duration, date } = req.body
  const exerciseDate = date ? new Date(date) : new Date()

  user.log.push({
    description: description,
    duration: Number(duration),
    date: exerciseDate
  })
  await user.save()

  res.json({
    _id: user._id,
    username: user.username,
    date: exerciseDate.toDateString(),
    duration: Number(duration),
    description: description
  })
})

// Get the exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id)
  const { from, to, limit } = req.query

  let log = user.log
  if (from) log = log.filter(e => e.date >= new Date(from))
  if (to) log = log.filter(e => e.date <= new Date(to))
  if (limit) log = log.slice(0, Number(limit))

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }))
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})