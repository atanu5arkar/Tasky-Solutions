import mongoose from "mongoose";

async function connectMongo() {
    try {
        const { MONGO_URI, DB_NAME } = process.env;
        await mongoose.connect(MONGO_URI + DB_NAME);
        console.log('Connected to MongoDB');
        
    } catch (error) {
        console.log('Unable to connect Mongo!');
        return console.error(error);
    }
}

connectMongo();