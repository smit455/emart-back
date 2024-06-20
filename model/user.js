const mongoose=require('mongoose')
const validator=require('validator')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const crypto=require('crypto')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please enter your name'],
        maxLength:[30,'Your name cannot exceed 30 characters']
    },
    email:{
        type:String,
        required:[true,'Please enter your email'],
        unique:true,
        validate:[validator.isEmail,'Please enter a valid email']
    },
    passWord:{
        type:String,
        required:[true,'Please enter your password'],
        minlength:[6,'Your password must be longer then 6 characters'],
        select:false
    },
    avatar:{
            public_id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required:true
            }
    },
    role:{
        type:String,
        default:'user'
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date
})

// In arrow function we cannot use "this"  so we use normal function
userSchema.pre('save',async function (next){
    if(!this.isModified('passWord')){
        next();
    }
    this.passWord=await bcrypt.hash(this.passWord,10)
})

userSchema.methods.comparePassword=async function (enteredPassword){
    return await bcrypt.compare(enteredPassword,this.passWord)
}

userSchema.methods.getJwtToken=function(){
    return jwt.sign({id:this.id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_TIMES
    })
}

userSchema.methods.getResetPasswordToken=function(){
    const resetToken=crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex')

    this.resetPasswordExpire=Date.now()+30*60*1000
    return resetToken
}
module.exports=mongoose.model('User',userSchema)