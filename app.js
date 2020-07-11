require('dotenv').config();
const express = require('express');
// const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/usersDB',{ useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secretSchema = new mongoose.Schema({
    data: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRETKEY, encryptedFields: ['password']});

const User = new mongoose.model("User",userSchema);
const Secret = new mongoose.model("Secret",secretSchema);

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.post('/register',(req,res)=>{
    bcrypt.hash(req.body.password,saltRounds,(err,result)=>{
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
    });
});

app.post('/login',(req,res)=>{
    const username = req.body.username;
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
    });

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

app.post('/submit',(req,res)=>{
    const secret = new Secret({
        data: req.body.secret
    });
    secret.save();
    res.render('secrets');
});

app.listen(3000,()=>{
    console.log("Server started at 3000");
});