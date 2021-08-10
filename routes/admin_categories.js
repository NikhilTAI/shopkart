var express=require('express');
const { ConnectionStates } = require('mongoose');
var router=express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// GET categoty model
var Category = require('../models/category');


// GET categoty index
router.get('/', isAdmin, function(req,res){
    // res.send('Cat')
    Category.find(function(err,categories){
        if(err) return console.log(err);
        res.render('admin/categories',{
            categories:categories
        });
    });
});

// GET add category
router.get('/add-category',isAdmin, function(req,res){
    var title = "";
    res.render('admin/add_category',{
        title:title
    });
});


//POST add category
router.post('/add-category',function(req,res){

    req.checkBody('title','title must have a value').notEmpty();
    console.log(req.body.title)
    var title = req.body.title;
    var slug = req.body.title.replace(/\s+/g, '-').toLowerCase();

    var errors=req.validationErrors();

    if (errors){
        res.render('admin/add_category',{
            errors:errors,
            title:title,
        }); 
    }else{
        Category.findOne({slug:slug},function(err,category){
            if(category){
                req.flash('danger','Category slug exist, choose another.')
                res.render('admin/add_categories',{
                    title:title
                });
            }else{
                var category = new Category({
                    title:title,
                    slug:slug
                });
                category.save(function(err){
                    if(err) return console.log(err);
                    Category.find(function(err,categories){
                        if(err){
                            console.log(err);
                        }else{
                            req.app.locals.categories = categories;
                        }
                    });
                    req.flash('success','Category added.');
                    res.redirect('/admin/categories');
                });
            }
        });
    }
});

// GET edit categoty MINE
// router.get('/edit-category/:id',function(req,res){
//     Category.findById(req.params.id,function(err,category){
//         if(err) {console.log(err);}
//         // console.log(req.params.id);
//         res.render('admin/edit_category',{
//             title: category.title,
//             id: category._id
//     });
//     // res.redirect('/admin/pages');
//     });
// });


// stack overflow
router.get('/edit-category/:id', isAdmin, (req, res) => {
    // console.log(`GET ${req.params.id}`);
    Category.findById(req.params.id).then((cat)=> {
        if(!cat) { //if page not exist in db
            return res.status(404).send('Category not found');
        }
        res.render('admin/edit_category', { //page  exist
        title: cat.title,
        id: cat._id
      });
    }).catch((e) => {//bad request 
      res.status(400).send(e);
    });
  });

// POST edit category
router.post('/edit-category/:id',function(req,res){
    // console.log(`POST ${req.params.id}`);
    req.checkBody('title','title must have a value').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var id = req.params.id;

    var errors=req.validationErrors();

    if (errors){
        res.render('admin/edit_category',{
            errors:errors,
            title:title,
            id:id
        }); 
    }else{
        Category.findOne({slug:slug, _id:{'$ne':id}},function(err,category){
            if(category){
                req.flash('danger','Category title exist, choose another.')
                res.render('admin/edit_category',{
                    title:title,
                    id:id
                });
            }else{
                Category.findById(id, function(err, category){
                    if(err) return console.log(err);
                    category.title=title;
                    category.slug=slug;

                    category.save(function(err){
                        if(err) return console.log(err);
                        Category.find(function(err,categories){
                            if(err){
                                console.log(err);
                            }else{
                                req.app.locals.categories = categories;
                            }
                        });
                        req.flash('success','category edited!');
                        res.redirect('/admin/categories/edit-category/'+id);
                    });
                })
            }
        });
    }
});

// GET delete category
router.get('/delete-category/:id', isAdmin, function(req,res){
    Category.findByIdAndRemove(req.params.id,function(err){
        if(err) return console.log(err);
        Category.find(function(err,categories){
            if(err){
                console.log(err);
            }else{
                req.app.locals.categories = categories;
            }
        });
        req.flash('success','Caregory deleted!');
        res.redirect('/admin/categories/');
        
    });
});

//exports
module.exports=router;