var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var auth = require('../config/auth');
var isUser = auth.isUser;


// GET products model
var Product = require('../models/product');
// GET category model
var Category = require('../models/category');

//GET all products 
router.get('/',function(req,res){
    Product.find(function(err, products){
        if(err){console.log(err);}
        res.render('all_products',{
                title:'All products',
                products:products
        });
    });
});

//GET products by category
router.get('/:category', (req, res) => {
    var categorySlug = req.params.category;
    Category.findOne({slug : categorySlug}).then((c)=> {
        Product.find({category:categorySlug}).then((products)=>{
            
      if(!c) { //if page not exist in db
        return res.status(404).send('Page not found');
      }
      res.render('cat_products', { //page  exist
        title: c.title,
        products: products
      });
    })
    }).catch((e) => {//bad request 
      res.status(400).send(e);
    });
  });

//GET product details
router.get('/:category/:product', function(req,res){
    var galleryImages = null;
    var loggedIn = (req.isAuthenticated()) ? true : false;

    Product.findOne({slug: req.params.product}, function(err, product){
        if(err){
            console.log(err);
        }else{
            var galleryDir = 'public/product_images/'+product._id+'/gallery';
            fs.readdir(galleryDir, function(err, files){
                if(err){
                    console.log(err);
                }else{
                    galleryImages = files;
                    res.render('product', {
                        title: product.title,
                        p: product,
                        galleryImages: galleryImages,
                        loggedIn: loggedIn
                    })
                }
            });
        }
    })
})

//exports
module.exports = router;