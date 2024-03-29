var express=require('express');
const { ConnectionStates } = require('mongoose');
var router=express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// GET pages model
var Page = require('../models/page');


// GET pages index
router.get('/', isAdmin, function(req,res){
    Page.find({}).sort({sorting:1}).exec(function(err,pages){
        res.render('admin/pages',{
            pages:pages
        });
    });
});

// GET add page
router.get('/add-page', isAdmin, function(req,res){

    var title = "";
    var slug = "";
    var content = "";

    res.render('admin/add_page',{
        title:title,
        slug:slug,
        content:content
    });
});

// POST add page
router.post('/add-page',function(req,res){
    req.checkBody('title','title must have a value').notEmpty();
    req.checkBody('content','content must have a value').notEmpty();

    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if(slug=="") slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    
    var errors=req.validationErrors();

    if (errors){
        res.render('admin/add_page',{
            errors:errors,
            title:title,
            slug:slug,
            content:content
        }); 
    }else{
        Page.findOne({slug:slug},function(err,page){
            if(page){
                req.flash('danger','Page slug exist, choose another.')
                res.render('admin/add_page',{
                    title:title,
                    slug:slug,
                    content:content
                });
            }else{
                var page = new Page({
                    title:title,
                    slug:slug,
                    content:content,
                    sorting:100
                });
                page.save(function(err){
                    if(err) return console.log(err);
                    Page.find({}).sort({sorting:1}).exec(function(err,pages){
                        if(err){
                            console.log(err);
                        }else{
                            req.app.locals.pages = pages;
                        }
                    });
                    req.flash('success','Page added.');
                    res.redirect('/admin/pages');
                });
            }
        });
    }
});

//sort pages function
function sortPages(ids, callback){
    var count = 0;
    for(var i=0; i<ids.length; i++){
        var id = ids[i];
        count++;
        (function(count){
            Page.findById(id, function(err, page){
                page.sorting = count;
                page.save(function(err){
                    if(err)
                        return console.log(err);
                    ++count;
                    if(count>=ids.length){
                        callback();
                    }
                });
            });
        })(count);
    }
}

// // post reorder pages
router.post('/reorder-pages', function (req, res) {
    var ids = req.body['id[]'];
    // console.log(req.body);
    sortPages(ids, function(){
        Page.find({}).sort({sorting:1}).exec(function(err,pages){
            if(err){
                console.log(err);
            }else{
                req.app.locals.pages = pages;
            }
        });
    });
});


//GET edit page MINE
// router.get('/edit-page/:slug',function(req,res){
//     Page.findOne({slug:req.params.slug}, function(err,page){
//         if(err) {console.log(err);}
//         res.render('admin/edit_page',{
//             title: page.title,
//             slug: page.slug,
//             content: page.content,
//             id: page._id
//     });
//     // res.redirect('/admin/pages');
//     });
// });

// stack overflow
router.get('/edit-page/:id', isAdmin, (req, res) => {
    // console.log(req.params.slug);
    Page.findById(req.params.id).then((page)=> {
      if(!page) { //if page not exist in db
        return res.status(404).send('Page not found');
      }
      res.render('admin/edit_page', { //page  exist
        title: page.title,
        slug: page.slug,
        content: page.content,
        id: page._id
      });
    }).catch((e) => {//bad request 
      res.status(400).send(e);
    });
  });

// POST edit page
router.post('/edit-page/:id', function(req,res){
    // console.log(req.params.slug);
    req.checkBody('title','title must have a value').notEmpty();
    req.checkBody('content','content must have a value').notEmpty();

    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if(slug=="") slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    var id = req.params.id;
    
    var errors=req.validationErrors();

    if (errors){
        res.render('admin/edit_page',{
            errors:errors,
            title:title,
            slug:slug,
            content:content,
            id:id
        }); 
    }else{
        Page.findOne({slug:slug, _id:{'$ne':id}},function(err,page){
            if(page){
                req.flash('danger','Page slug exist, choose another.')
                res.render('admin/edit_page',{
                    title:title,
                    slug:slug,
                    content:content,
                    id:id
                });
            }else{
                Page.findById(id, function(err, page){
                    if(err) return console.log(err);
                    page.title=title;
                    page.slug=slug;
                    page.content=content;
                    
                    page.save(function(err){
                        if(err) return console.log(err);
                        Page.find({}).sort({sorting:1}).exec(function(err,pages){
                            if(err){
                                console.log(err);
                            }else{
                                req.app.locals.pages = pages;
                            }
                        });
                        req.flash('success','Page edited!');
                        res.redirect('/admin/pages/edit-page/'+id);
                    });
                })
            }
        });
    }
});

// GET delete page
router.get('/delete-page/:id', isAdmin, function(req,res){
    Page.findByIdAndRemove(req.params.id,function(err){
        if(err) return console.log(err);
        Page.find({}).sort({sorting:1}).exec(function(err,pages){
            if(err){
                console.log(err);
            }else{
                req.app.locals.pages = pages;
            }
        });
        req.flash('success','Page deleted!');
        res.redirect('/admin/pages/');
        
    });
});

//exports
module.exports=router;