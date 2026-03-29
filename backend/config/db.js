import mongoose from "mongoose";

const connectDB = ()=>{
    try{
         mongoose.connect(process.env.MONGO_URI);
         console.log("Database Connected");
    }catch(err){
        console.log("Database connection failed", err.message);
        process.exit(1)
    }  
}

export default connectDB