const mongoose = require('mongoose');

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(con => {
        console.log(`Database connected with host: ${con.connection.host}`);
    }).catch(err => {
        console.error(`Database connection error: ${err}`);
        process.exit(1); 
    });
};

module.exports = connectDatabase;
