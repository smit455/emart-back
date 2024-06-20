const express = require("express")
const errorMiddleware = require('./middlewares/errors')
const cookieParser=require('cookie-parser')
const bodyparser=require('body-parser')
const fileUpload=require('express-fileupload')
const path=require('path')

const app = express();
if(process.env.NODE_ENV!=="PRODUCTION") require('dotenv').config({path: '/server/config/config.env'});

app.use(express.json());
app.use(bodyparser.urlencoded({extended:true}))
app.use(cookieParser()) 
app.use(fileUpload({useTempFiles:true}))


const products=require('./routes/product');
const auth=require('./routes/auth');
const order=require('./routes/order')
const payment=require('./routes/payment')

app.use('/api/v1',products)
app.use('/api/v1',auth)
app.use('/api/v1',order)
app.use('/api/v1',payment)

if(process.env.NODE_ENV==='PRODUCTION'){
    app.use(express.static(path.join(__dirname,'../client/build')))
    app.get('*',(req,res)=>{
        res.sendFile(path.resolve(__dirname,'../client/build/index.html'))
    })
}

app.use(errorMiddleware);
module.exports=app;