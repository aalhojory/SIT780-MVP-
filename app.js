const express = require('express');
const app = express();
const utils = require('./utils/task-schema.js')

app.use(express.json());



app.use(express.static(__dirname + '/views'));


app.use(express.static(__dirname));

const bodyParser=require('body-parser');
const expressSession=require('express-session')({
  secret:'secret',
  resave:false,
  saveUninitialized:false
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(expressSession);

const port=process.env.PORT || 3000;
module.exports = app.listen(port,()=>console.log('App listening on port '+port));


app.set('view engine', 'ejs');

const tasks = [
    {
        id: 1,
        name: "Task 1",
        completed: false
    },
    {
        id: 2,
        name: "Task 2",
        completed: false
    },
    {
        id: 3,
        name: "Task 3",
        completed: false
    }
];

// GET
app.get("/api/tasks" , (request, response) => {
    response.send(tasks);
});

// GET (BY ID)
app.get("/api/tasks/:id" , (request, response) => {
    const taskId = request.params.id;
    const task = tasks.find(task => task.id === parseInt(taskId));
    if(!task) return response.status(404).send("The task with the provided ID does not exist.");
    response.send(task);
});

// POST
app.post("/api/tasks", (request, response) => {
    const { error } = utils.validateTask(request.body);

    if(error) return response.status(400).send("The name should be at least 3 chars long!")

    const task = {
        id: tasks.length + 1,
        name: request.body.name,
        completed: request.body.completed
    };

    tasks.push(task);
    response.status(201).send(task);
});

//PUT
app.put("/api/tasks/:id", (request, response) => {
    const taskId = request.params.id;
    const task = tasks.find(task => task.id === parseInt(taskId));
    if(!task) return response.status(404).send("The task with the provided ID does not exist.");

    const { error } = utils.validateTask(request.body);

    if(error) return response.status(400).send("The name should be at least 3 chars long!")

    task.name = request.body.name;
    task.completed = request.body.completed;

    response.send(task);
});

//PATCH
app.patch("/api/tasks/:id", (request, response) => {
    const taskId = request.params.id;
    const task = tasks.find(task => task.id === parseInt(taskId));
    if(!task) return response.status(404).send("The task with the provided ID does not exist.");

    const { error } = utils.validateTask(request.body);

    if(error) return response.status(400).send("The name should be at least 3 chars long!")

    task.name = request.body.name;

    if(request.body.completed) {
        task.completed = request.body.completed;
    }
    response.send(task);
});

//DELETE
app.delete("/api/tasks/:id", (request, response) => {
    const taskId = request.params.id;
    const task = tasks.find(task => task.id === parseInt(taskId));
    if(!task) return response.status(404).send("The task with the provided ID does not exist.");

    const index = tasks.indexOf(task);
    tasks.splice(index, 1);
    response.send(task);
});



/* Passport Setup */
const passport =require('passport');
app.use(passport.initialize());
app.use(passport.session());


/* MONGOOSE SETUP */
const mongoose =require('mongoose');
const passportLocalMongoose=require('passport-local-mongoose');

mongoose.connect('mongodb+srv://abo:abo@cluster0.yr3fb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{
  useNewUrlParser:true,useFindAndModify:true
})

const { MongoClient } = require('mongodb')
const url = 'mongodb+srv://abo:abo@cluster0.yr3fb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'


const Schema=mongoose.Schema;
const UserDetail=new Schema({
  username:String,
  password:String
});

UserDetail.plugin(passportLocalMongoose);
const UserDetails=mongoose.model('userInfo',UserDetail,'userInfo');


const schema = new Schema(
  {
    Movie:{type: String},
    Hero:{type:String},
    language:{type:String},
    year:{type:String},
    country:{type:String}
  }
);

const Movie = mongoose.model('movie', schema, 'movie');

/*Passport LOCAL AUTHENTICATION*/

passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

/* ROUTES */
const connectEnsureLogin=require('connect-ensure-login');


app.get('/',
  (req,res)=> res.sendFile('views/login.html',{root:__dirname})
);

app.get('/index',
  
  connectEnsureLogin.ensureLoggedIn(),
  (req,res)=> {
    console.log("router");
    res.sendFile('views/index2.html',{root:__dirname})}
);

app.post('/login',(req,res,next)=>{
  console.log("body parsing", req.body);
  passport.authenticate('local',
  (err,user,info)=>{
    console.log("console",err,user,info)
    if (err) {
      return next(err);
    }
    if (!user){
      return res.redirect('/login?info=' + info);
    }
    req.logIn(user,function(err){
      if (err){
        return next(err);
      }
      res.sendFile('views/index2.html',{root:__dirname})
    })
  })(req,res,next);
});




// Register
app.post('/register', (req, res) => {
  console.log("body",req.body)
  const { username, password, password2 } = req.body;
  let errors = [];

  if (!username || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });y

  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      username,
      password,
      password2
    });
  } else {
    
    UserDetails.register({username:username,active:true},password)
    res.sendFile('views/login.html',
    {root:__dirname})
        /*
        
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err;
            password = hash;
           
          });
        });*/
      
    
  }
});



// Register Page
app.get('/register', 
  (req, res) => res.sendFile('views/register.html',
  {root:__dirname})
  );


app.get('/login',
  (req,res)=> res.sendFile('views/login.html',
  {root:__dirname})
);

app.get('/allmovies', 
connectEnsureLogin.ensureLoggedIn(),
  async(req, res) =>{
    
    const client = new MongoClient(url)
    const dbName = 'myFirstDatabase'
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection('Movies')

    var movies=await collection.find().sort({_id:1}).limit(10).toArray()
    console.log("body Movies", movies);
      
      //console.log("body Movies", Movies);
        res.render('allmovies.ejs',
        {data: { movies: movies },root:__dirname})
      
    

  
  });

// Logout
app.post('/logout', (req, res) => {
  req.logout();
  res.sendFile('views/login.html',{root:__dirname})
});
app.get('/private',
  connectEnsureLogin.ensureLoggedIn(),
  (req,res)=> res.sendFile('views/private.html',{root:__dirname})
);

app.get('/user',
  connectEnsureLogin.ensureLoggedIn(),
  (req,res)=> res.sendFile('views/private.html',{root:__dirname})
);

app.post('/add-movie', (req,res)=>{
  
  console.log("body parsing", req.body);
  mongoose.connection.collection("Movies").insertOne(req.body, async  function(err, resp) {
    if (err) throw err;
    console.log("1 document inserted");
    const client = new MongoClient(url)
    const dbName = 'myFirstDatabase'
    await client.connect()
    const db = client.db(dbName)
    const collection = db.collection('Movies')

    var movies=await collection.find().sort({_id:1}).limit(10).toArray()
    console.log("body Movies", movies);

    res.render('allmovies.ejs',
        {data: { movies: movies },root:__dirname})
  });
});