require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://localhost:27017/usersDB',{ useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encrypt, {secret: process.env.SECRETKEY, encryptedFields: ['password']});

const User = new mongoose.model("User",userSchema);

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
    const user = new User({
        email: req.body.username,
        password: req.body.password
    });
    user.save((err)=>{
        if(!err){
            res.render('secrets');
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
            if(result.password === passwd){
                res.render('secrets');
            }
        }else{
            console.log(err);
        }
    });
});

app.listen(3000,()=>{
    console.log("Server started at 3000");
});