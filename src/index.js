// require('dotenv').config({path:"./.env"})
import dotenv from "dotenv"

import mongoose from "mongoose"
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js"; 

dotenv.config({
    path:'./env'
})

connectDB().then(
    ()=>{
        application.listen(process.env.PORT || 8000, ()=>{
            console.log(`app is listening on port ${process.env.PORT || 8000}`)
        } )
    }
).catch((error)=>{
    console.log("DB connection error ", error)
})








/*
import express from "express"

const app=express()
;(async ()=>{
try{
await mongoose.connect(`${process.env.MONGODB_URI}`)
app.on("error", (error)=>{
    console.log("ERRR:", error)
})
app.listen(process.env.PORT,()=>{
    console.log(`app is listening on portg ${process.env.PORT}`)
})
}
catch(error){
    console.error("error:", error)
    throw error
}
})() */