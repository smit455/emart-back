const Product=require('../model/product')
const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors=require('../middlewares/catchAsyncErrors')
const APIFeatures=require('../utils/apiFeatures')
const cloudinary=require('cloudinary')

exports.newProduct=catchAsyncErrors(async(req,res,next)=>{
    let images=[]

    if (Array.isArray(req.body.images)) {
        images = req.body.images;
    } else if (typeof req.body.images === 'string') {
        images.push(req.body.images);
    } else {
        console.error('Invalid format for images:', req.body.images);
        return res.status(400).json({ success: false, message: 'Invalid format for images' });
    }
    let imagesLinks=[];

    for(let i=0;i<images.length;i++){
        const result=await cloudinary.v2.uploader.upload(images[i],{
            folder:'products'
        });
        imagesLinks.push({
            public_id:result.public_id,
            url:result.url
        })
    }

    req.body.images=imagesLinks
    req.body.user=req.user.id;

    const product=await Product.create(req.body);
    
    res.status(201).json({
        success:true,
        product,
    })
})


exports.getProducts=catchAsyncErrors(async (req,res,next)=>{

    const resPerPage=4; 
    const productCount=await Product.countDocuments()
    
    let apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter()
        .pagination(resPerPage);

    const products = await apiFeatures.query;
    let filteredProductsCount = products.length;
    res.status(200).json({
        success:true,
        productCount,
        resPerPage,
        filteredProductsCount,
        products 
    })
})

exports.getAdminProducts=catchAsyncErrors(async (req,res,next)=>{

    const products=await Product.find();
    res.status(200).json({
        success:true,
        products 
    })
})

exports.getSingleProduct=catchAsyncErrors(async(req,res,next)=>{
    const product=await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler('product not found',404))
    }

    res.status(200).json({
        success:true,
        product
    })
})

exports.updateProduct=catchAsyncErrors(async(req,res,next)=>{
    let product=await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler('product not found',404))
    }

    let images=[]

    if(typeof req.body.images ==='string'){
        images.push(req.body.images)
    }else{
        images=req.body.images
    }

    if(images !== undefined){
        for(let i=0;i<product.images.length;i++){
            const result=await cloudinary.v2.uploader.destroy(product.images[i].public_id)
        }
        let imagesLinks=[];

    for(let i=0;i<images.length;i++){
        const result=await cloudinary.v2.uploader.upload(images[i],{
            folder:'products'
        });
        imagesLinks.push({
            public_id:result.public_id,
            url:result.url
        })
    }

    req.body.images=imagesLinks
    }

    

    product=await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,
        product
    })
})


exports.deleteProduct=catchAsyncErrors(async(req,res,next)=>{
    const product=await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler('product not found',404))
    }
    
    for(let i=0;i<product.images.length;i++){
        const result=await cloudinary.v2.uploader.destroy(product.images[i].public_id)
    }
    await product.deleteOne();

    res.status(200).json({
        success:true,
        message:'Product is deleted'
    })
})

exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const { rating, comment, productId } = req.body;

    if (!rating || !comment || !productId) {
        return res.status(400).json({
            success: false,
            message: 'Rating, comment, and productId are required fields.'
        });
    }

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found.'
        });
    }

    if (!product.reviews) {
        product.reviews = [];
    }

    const userId = req.user && req.user._id ? req.user._id.toString() : null;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID not found.'
        });
    }

    const isReviewed = product.reviews.find(
        r => r.user && r.user.toString() === userId
    );
    console.log(isReviewed)

    if (isReviewed) {
        product.reviews.forEach(review => {
            if (review.user && review.user.toString() === userId) {
                review.comment = comment;
                review.rating = rating;
            }
        });

    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });

});



exports.getProdcutReviews=catchAsyncErrors(async(req,res,next)=>{
        const product=await Product.findById(req.query.id);
        res.status(200).json({
            success:true,
            reviews:product.reviews
        })
})

exports.deleteReviews=catchAsyncErrors(async(req,res,next)=>{
    const product=await Product.findById(req.query.productId);

    const reviews=product.reviews.filter(review=>review._id.toString() !== req.query.id.toString());
    const numOfReviews=reviews.length;
    const ratings=product.reviews.reduce((acc,item)=>item.rating+acc,0)/reviews.length

    await Product.findByIdAndUpdate(req.query.productId,{
        reviews,
        ratings,
        numOfReviews
    },{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })
    res.status(200).json({
        success:true
    })
})
