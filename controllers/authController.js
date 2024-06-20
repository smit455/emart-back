const User=require('../model/user')

const ErrorHandler = require('../utils/errorHandler')
const catchAsyncErrors=require('../middlewares/catchAsyncErrors');
// const { errorMonitor } = require('nodemailer/lib/xoauth2');
const sendToken = require('../utils/jwtToken');
const sendEmail =require('../utils/sendEmail')
const crypto=require('crypto')
const cloudinary=require('cloudinary')
const multer = require('multer');
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

upload.single('avatar'),
exports.registerUser=catchAsyncErrors(async(req,res,next)=>{
    
    const result=await cloudinary.v2.uploader.upload(req.body.avatar,{
        folder:'avatars',
        width:150,
        crop:"scale"
    })

    const {name,email,passWord}=req.body;
    const user=await User.create({
        name,
        email,
        passWord,
        avatar:{
            public_id:result.public_id,
            url:result.url
        }
    });
    
    sendToken(user,200,res)
})

exports.loginUser=catchAsyncErrors(async(req,res,next)=>{
    const {email,passWord}=req.body;
    if(!email || !passWord){
        return next(new ErrorHandler('Please enter email & passWord',400))
    }
    const user=await User.findOne({email}).select('+passWord')
    if(!user){
        return next(new ErrorHandler('Invalid email or passWord',401))
    }

    const isPasswordMatched=await user.comparePassword(passWord);
    if(!isPasswordMatched){
        return next(new ErrorHandler('Invalid email or passWord',401))
    }
    
    sendToken(user,200,res);
})

exports.logout=catchAsyncErrors(async(req,res,next)=>{
    res.cookie('token',null,{
        expires:new Date(Date.now()),
        httpOnly:true
    })
    res.status(200).json({
        success:true,
        message:'Logged out'
    })
})



exports.forgotPasssword=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findOne({email:req.body.email})
    if(!user){
        return next(new ErrorHandler('User not found',404))
    }
    const resetToken=user.getResetPasswordToken();
    await user.save({validateBeforeSave:false});
    const resetUrl=`${req.protocol}://${req.get('host')}/password/reset/${resetToken}`;
    const message=`You are receiving this email because you (or someone else) has requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;

    try {
        await sendEmail({
            email:user.email,
            subject:'Password reset token from emart',
            message
        })
 
        res.status(200).json({
            success:true,
            message:`Email sent to: ${user.email}`
        })
    } catch (error) {
        user.resetPasswordExpire=undefined;
        user.resetPasswordToken=undefined;

        await user.save({validateBeforeSave:false});
        return next(new ErrorHandler(error.message,500))

    }
})

exports.resetPassword=catchAsyncErrors(async(req,res,next)=>{
    const resetPasswordToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user=await User.findOne({resetPasswordToken,resetPasswordExpire:{$gt:Date.now()}});
    if(!user){
        return next(new ErrorHandler('Invalid token',400))
    }
    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler('Password do not match',400))
    }
    user.passWord=req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save();
    sendToken(user,200,res);
    
})

exports.getUserProfile=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        user
    })
})

exports.updatePassword=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.user.id).select('+passWord');
    const isMatched=await user.comparePassword(req.body.oldPassword)
    if(!isMatched){
        return next(new ErrorHandler('old password is incorrect',400))
    }
    user.passWord=req.body.password
    await user.save();
    sendToken(user,200,res)
})

exports.updateProfile=catchAsyncErrors(async(req,res,next)=>{
   const newUserData={
    name:req.body.name,
    email:req.body.email
   }

   if(req.body.avatar !== ''){
    const user=await User.findById(req.user.id)
    console.log(user)
    const image_id=user.avatar.public_id
    console.log(image_id)
    const res=await cloudinary.v2.uploader.destroy(image_id)

    const result=await cloudinary.v2.uploader.upload(req.body.avatar,{
        folder:'avatars',
        width:150,
        crop:"scale"
    })
    newUserData.avatar={    
        public_id:result.public_id,
        url:result.url
    }
}

   const user=await User.findByIdAndUpdate(req.user.id,newUserData,{
    new:true,
    runValidators:true,
    useFindAndModify:false
   })
   res.status(200).json({
    success:true
   })
})

exports.allUsers=catchAsyncErrors(async(req,res,next)=>{
    const users=await User.find();
    res.status(200).json({
        success:true,
        users   
    })
})

exports.getUserDetails=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.params.id);
    
    if(!user){
        return next(new ErrorHandler(`User does not found with this id: ${req.params.id}`))
    }
    res.status(200).json({
        success:true,
        user
    })
})

exports.updateUser=catchAsyncErrors(async(req,res,next)=>{
    const newUserData={
     name:req.body.name,
     email:req.body.email,
     role:req.body.role
    }
    
    const user=await User.findByIdAndUpdate(req.params.id,newUserData,{
     new:true,
     runValidators:true,
     useFindAndModify:false
    })
    res.status(200).json({
     success:true
    })
})

 exports.deleteUser=catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.params.id);
    
    if(!user){
        return next(new ErrorHandler(`User does not found with this id: ${req.params.id}`))
    }

    const image_id=user.avatar.public_id
    res=await cloudinary.v2.uploader.destroy(image_id)

    await user.deleteOne()
    res.status(200).json({
        success:true
    })
})