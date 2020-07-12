require('dotenv').config();
const express = require('express');
// const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/usersDB',{ useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, {secret: process.env.SECRETKEY, encryptedFields: ['password']});

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile);
       User.findOrCreate({ username: profile.id}, function (err, user) {
            return done(err, user);
       });
  }
));

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get('/login',(req,res)=>{
    if(req.isAuthenticated()){
        res.redirect('secrets');
    }else{
        res.render('login');
    }
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.get('/secrets',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('secrets');
    }else{
        res.redirect('login');
    }
});

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/');
})

app.post('/register',(req,res)=>{

    User.register({username: req.body.username}, req.body.password,(err,user)=>{
        if(!err){
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets');
            });
        }else{
            console.log(err);
            res.render('register');
        }
    })

    /* bcrypt.hash(req.body.password,saltRounds,(err,result)=>{
        if(!err){
            const user = new User({
                email: req.body.username,
                password: result
            });
            user.save((err)=>{
                if(!err){
                    res.render('secrets');
                }else{
                    console.log(err);
                }
            });
        }else{
            console.log(err);   
        }
    }); */
});

app.post('/login',(req,res)=>{

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user,(err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets');
            });
        }
    });

    /* const username = req.body.username;
    const passwd = req.body.password;

    User.findOne({email :username},(err,result)=>{
        if(result){
            bcrypt.compare(passwd,result.password,(err,result)=>{
                if(result===true){
                    res.render('secrets');
                }else{
                    console.log('Passwords were wrong');
                }
            })
        }else{
            console.log(err);
        }
    }); */

    // Below way is not working.
    /* bcrypt.hash(req.body.password,saltRounds,(err,result)=>{
        if(!err){
            const passwd = result;
            User.findOne({email :username},(err,result)=>{
                if(result){
                    if(result.password === passwd){
                        res.render('secrets');
                    }else{
                        console.log("Here");
                    }
                }else{
                    console.log(err);
                }
            });
        }else{
            console.log(err);
        }
    }); */
});

app.get('/submit',(req,res)=>{
    res.render('submit');
});

app.listen(3000,()=>{
    console.log("Server started at 3000");
});