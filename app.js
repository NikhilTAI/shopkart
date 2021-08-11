var express = require('express');
var path = require('path');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload')
var passport = require('passport');

//con to db
mongoose.connect('mongodb://localhost:27017/shopkart', {useNewUrlParser: true, useUnifiedTopology: true});
// mongoose.connect('mongodb+srv://nikhiltai:nikhil2025@shopkart.1yahp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('connected to mongodb');
});


//Init app
var app=express()

//view Engine setup
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

//Set public folder
app.use(express.static(path.join(__dirname,'public')));

//set global errors var
app.locals.errors=null;

//Get page model
var Page = require('./models/page')

//get all pages to pass to header.ejs
Page.find({}).sort({sorting:1}).exec(function(err,pages){
    if(err){
        console.log(err);
    }else{
        app.locals.pages = pages;
    }
});

//Get category model
var Category = require('./models/category')

//get all categories to pass to header.ejs
Category.find(function(err,categories){
    if(err){
        console.log(err);
    }else{
        app.locals.categories = categories;
    }
});

//Express fileUpload
app.use(fileUpload());

//Body parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//Express session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,

  }))     

  //Express Validator middleware
  app.use(expressValidator({
    errorFormatter: function(param, msg,value){
        var namespace = param.split('.')
        ,root = namespace.shift()
        ,formParam = root;
        while(namespace.length){
            formParam += '['+namespace.shift()+']';
        }
        return{
            param : formParam,
            msg : msg,
            value : value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch(extension){
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));


//Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Passport config
require('./config/passport')(passport);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());


app.get('*', function(req,res,next){
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next();
})
 
//set routes 
var pages=require("./routes/pages.js");
var products=require("./routes/products.js");
var cart=require("./routes/cart.js");
var users=require("./routes/users.js");
var adminPages=require("./routes/admin_pages.js");
var adminCategories=require("./routes/admin_categories.js");
var adminProducts=require("./routes/admin_products.js");

app.use('/admin/pages',adminPages);
app.use('/admin/categories',adminCategories);
app.use('/admin/products',adminProducts);  
app.use('/products',products);
app.use('/cart',cart);
app.use('/users',users);
app.use('/',pages);

//start server
const port = process.env.PORT || 3000;
app.listen(port ,function(){
    console.log(`Listening on port: ${port}`);
})
