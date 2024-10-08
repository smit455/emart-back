const app = require("./app")
const connectDatabase= require('./config/database')
const cloudinary=require('cloudinary')

process.on('uncaughtException',err=>{
    console.log(`ERROR: ${err.stack}`)
    console.log('Shutting down due to Uncaught exception');
        process.exit(1);
})


if(process.env.NODE_ENV!=="PRODUCTION") require('dotenv').config({path: 'server/config/config.env'});
connectDatabase();

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})


const server= app.listen(process.env.PORT,()=>{
    console.log(`server connected at port: ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
})

process.on('unhandledRejection',err=>{
    console.log(`ERROR: ${err.message}`)
    console.log('Shutting down the server due to Unhandled Promise rejection');
    server.close(()=>{
        process.exit(1);
    })
})