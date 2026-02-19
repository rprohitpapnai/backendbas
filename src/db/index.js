import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

const connectDB = async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n mongo db conncected db host : ${conncectionInstance.connection.host}`)
    }
    catch(error){
        console.log("MONGO connection error ", error)
        process.exit(1)
    }
}

export default connectDB