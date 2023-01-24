const express = require('express')
const app = express()
const cors = require('cors')
const urlencoded = require('express')
let moment = require('moment');
require('dotenv').config()

const mongoose = require('mongoose')


// MONGO DB CONFIG
mongoose.connect(process.env.DB_KEY, () => {
  console.log(mongoose.connection.readyState)
});

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
  },
}, { versionKey: false })

const User = mongoose.model('User', userSchema)


const exerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId: String,
}, { versionKey: false })

const Exercises = mongoose.model('Exercises', exerciseSchema)




// // MONGO DB CONFIG

app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});




app.get('/api/users', async (req, res) => {
  const userList = await User.find();
  res.send(userList)
})

app.post('/api/users', async (req, res) => {
  let username = req.body.username;
  const userExist = await User.findOne({ username })

  if (userExist) {
    res.json(userExist);
    return;
  }

  let user = await User.create({
    username,
  });

  res.json(user);

});




app.get('/api/users/:_id/logs', async (req, res) => {
  let {from, to, limit} = req.query
  
  const userId = req.params._id;
  const foundUser = await User.findById(userId)

  if (!foundUser) {
    res.json({ nessage: "user exist for that id" })
    return;
  }
 
  let filter = {userId};
  let dateFilter = {};
  
  if(from) {
    dateFilter['$gte'] = new Date(from); 
  }
  if (to) {
    dateFilter['$lte'] = new Date(to);
  }
  if (from || to) {
   filter.date = dateFilter;
  }
  if (!limit) {
    limit = 1;
  }

  let exercises = await Exercises.find({ filter }).limit(limit);
  
   

  exercises = exercises.map((exercises) => {
   
      
    let dateN = exercises.date
    dateN.setDate(dateN.getDate() + 1);




      
    return {

      description: exercises.description,
      duration: exercises.duration,
      date: dateN.toDateString(),
    }
  })
   
  res.json({
    username: foundUser.username,
    count: exercises.length,
    _id: userId,
    log: exercises,
  
  });

})


app.post('/api/users/:_id/exercises', async (req, res) => {
  let { description, duration, date, } = req.body;
  const userId = req.params._id;

  let foundUser = await User.findById(userId)
  
  if (!foundUser) {
    res.json({ nessage: "No user exist for that id" })
    return;
  }
    if (!date) {
       date = new Date()
    } else {
       date = new Date(date)
    }
    
    
    await Exercises.create({
      username: foundUser.username,
      description,
      duration,
      date,
      userId,
    })
    
    let finalDate = moment(date)
    let finaldatePlusOne = finalDate.add(1, 'days')
  res.json({ 

    username: foundUser.username,
    description,
    duration: Number(duration),
    date: finaldatePlusOne.format("ddd MMM DD YYYY"),
    _id: userId,
  })
})






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
