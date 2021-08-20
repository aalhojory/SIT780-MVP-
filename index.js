const express =require('express');
const app =express();

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
app.listen(port,()=>console.log('App listening on port '+port));


/* Passport Setup */
const passport =require('passport');
app.use(passport.initialize());
app.use(passport.session());


/* MONGOOSE SETUP */
const mongoose =require('mongoose');
const passportLocalMongoose=require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/MyDatabase',{
  useNewUrlParser:true,useFindAndModify:true
})

const Schema=mongoose.Schema;
const UserDetail=new Schema({
  username:String,
  password:String
});

UserDetail.plugin(passportLocalMongoose);
const UserDetails=mongoose.model('userInfo',UserDetail,'userInfo');


/*Passport LOCAL AUTHENTICATION*/

passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

/* ROUTES */
const connectEnsureLogin=require('connect-ensure-login');

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
      return res.redirect('/');
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
    errors.push({ msg: 'Passwords do not match' });
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
    res.sendFile('html/login.html',
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
  (req, res) => res.sendFile('html/register.html',
  {root:__dirname})
  );


app.get('/login',
  (req,res)=> res.sendFile('html/login.html',
  {root:__dirname})
);

app.get('/',
  connectEnsureLogin.ensureLoggedIn(),
  (req,res)=> res.sendFile('html/index.html',{root:__dirname})
);
// Logout
app.post('/logout', (req, res) => {
  req.logout();
  res.sendFile('html/login.html',{root:__dirname})
});
app.get('/private',
  connectEnsureLogin.ensureLoggedIn(),
  (req,res)=> res.sendFile('html/private.html',{root:__dirname})
);

app.get('/user',
  connectEnsureLogin.ensureLoggedIn(),
  (req,res)=> res.sendFile('html/private.html',{root:__dirname})
);

/* ReGISTER SOME USERS 
UserDetails.register({username:'paul',active:false},'paul')
UserDetails.register({username:'jay',active:false},'jay')
UserDetails.register({username:'roy',active:false},'roy')*/
















