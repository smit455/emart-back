const Product=require('../model/product')
const dotenv=require('dotenv');
const connectDatabase=require("../config/database")
const products=require('../data/products.json');

dotenv.config({path: 'server/config/config.env'});
 
connectDatabase();

const seedProducts=async()=>{
    try{
        await Product.deleteMany();
        console.log("product deleted");
        await Product.insertMany(products);
        console.log("product added");
        
        process.exit();
    }
    catch(error){
        console.log(error.message);
        process.exit();
    }
}

seedProducts()