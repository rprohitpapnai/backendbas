import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const videoSchema = new Schema({
    videoFile:{
        type:String, //cloudinary url we gonna use
        required:true,
    },
    thumbnail:{
        type:String, //cloudinary url we gonna use
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type: String,
        required:true
    },
    duratrion:{
        type:Number, // also used cloudinary for description
        required :true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }



},{
    timestamps:true
    
})
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)