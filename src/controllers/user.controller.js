import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId)=>{
  try{
    const user=await User.findById(userId)
    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()
    user.refreshToken=refreshToken;
   await user.save(
      {validateBeforeSave:false}
    )
    return {accessToken, refreshToken}
  }
  catch(error){
    throw new ApiError(500, "Token generation failed")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  console.log(req.body);

  // Validate fields
  if ([fullname, email, username, password].some(
      (field) => field?.trim() === ""
  )) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [
      { email },
      { username }
    ]
  });

  if (existedUser) {
    throw new ApiError(
      409,
      "User already exists with the provided email or username"
    );
  }

  const avatarLocalPath= req.files?.avatar[0]?.path
  const coverImageLocalPath=req.files?.coverImage[0]?.path;
  if(!avatarLocalPath ){
    throw new ApiError(400, "Avatar are required")
  }

   const avatar=await uploadOnCloudinary(avatarLocalPath,"avatar")
  const coverImage=await uploadOnCloudinary(coverImageLocalPath,"coverImage")
if(!avatar){
    throw new ApiError(400, "Avatar are required")
}

const user =await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage.url||"",
    email,
    username:username.toLowerCase(),
    password,
})

const createduser =await User.findById(user._id).select(
    "-password -refreshToken"
)
if (!createduser){
    throw new ApiError(500, "User creation failed")

}

return res.status(201).json(
    new ApiResponse(201, createduser,"user registered successfully")
)
})

const loginUser = asyncHandler(async (req, res) => {
  // Implement login logic here
  //req body -> data 
  // check if user exist with the pprovided email or username 
  //find the user 
  //if user not exist -> user not exist sign up
  //if user exist -> compare the password
  // send cookies 
  // success response
  const {email, username, password}=req.body;
  if(!email || !username){
    throw new ApiError(400, "Email or username is required")
  }
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (!user) {
    throw new ApiError(401, "Invalid credentials")
  }
  const isPasswordValid=await user.isPasswordCorrect(password)
 if (!isPasswordValid){
    throw new ApiError(401, "Invalid credentials")
 }
 const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

 const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

 const options={
  httpOnly:true,
  secure:true,
 }
  return res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(200,
      {
        user:loggedInUser, accessToken, refreshToken
      },
      "User logged in successfully"
    )
  )
      }
    )
  
const logoutUser= asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id,{
    $set:{
      refreshToken:undefined
    }},
    {
      new:true
    }
  )
  const options={
  httpOnly:true,
  secure:true,
 }
 return res.status(200)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
 .json(
  new ApiResponse(200,
    {
      message:"User logged out successfully"
    },
    "User logged out successfully"
  )
 )
    
})

const refreshAccessToken= asyncHandler(async (req, res) => {
const incomingRefreshToken = req.cookies.refreshToken|| req.body.refreshToken
if (!incomingRefreshToken){
  throw new ApiError(401, "Unauthorized request"
  )

}

try {
  const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
  const user= await user.findById(decodedToken?._id)
  if(!user){
    throw new ApiError(401, "Unauthorized request"
    )
  }
  if(user.refreshToken!==incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }
  const option={
    httpOnly:true,
    secure:true,
  }
  const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
  return res.status(200)
  .cookie("accessToken", accessToken, option)
  .cookie("refreshToken", newrefreshToken, option)
  .json(
    new apiResponse(200,
      {accessToken, refreshToken:newrefreshToken},
      "User logged in successfully"
    )
  )
  
} catch (error) {
  throw new ApiError(401, "invalid refresh token")
  
}

}) 

const changeCurrentPassword= asyncHandler(async (req, res) => {
const {oldPassword, newPassword}= req.body;
const user = await User.findById(req.user?._id)
const isPasswordValid=await user.isPasswordCorrect(oldPassword)
if(!isPasswordValid){
  throw new ApiError(400, "Invalid credentials of the password")
}
user.password= newPassword
await user.save({validateBeforeSave:false})


return res.status(200).json(200,{},"password changed successfully")



})

const getCurrentUser= asyncHandler(async (req, res) => {

  return res.status(200)
  .json(200,req.user,"User fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const {fullname, email, }=req.body;
  if(!fullname || !email){
    throw new ApiError(400, "Fullname and email are required")
  }
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set:{
        fullname,
        email:email,
      }
    },{new:true }).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200,
        user,
        "User updated successfully"
      )
    )
  

})

const updateUserAvatar = asyncHandler(async (req, res) => {

  const avatarLocalPath=req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar are required")
  }
 const avatar= await  uploadOnCloudinary(avatarLocalPath, "avatar")
if (!avatar){
  throw new ApiError(400, "Avatar are required error while uploading avatar")
}

const user = await User.findByIdAndUpdate(req.user?._id,
  {
    $set:{
      avatar:avatar.url
    }
  },{new:true}.select("-password")
)
return res.status(200).json(
  new ApiResponse(200,
    user,
    "Avatar updated successfully"
  )
)

})
const updateUserCoverImage = asyncHandler(async (req, res) => {

  const coverImageLocalPath=req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image is required")
  }
 const coverImage= await  uploadOnCloudinary(coverImageLocalPath, "coverImage")
if (!coverImage){
  throw new ApiError(400, "Cover image is required error while uploading cover image")
}

const user=await User.findByIdAndUpdate(req.user?._id,
  {
    $set:{
      coverImage:coverImage.url
    }
  },{new:true}.select("-password")
)

return res.status(200).json(
  new ApiResponse(200,
    user,
    "Cover image updated successfully"
  )
)

})


const getUserChannelProfile = asyncHandler(async (req, res) => {
const {username}=req.params

if(!username?.trim()){
throw new ApiError(400, "Username is required")

}
const channel = await User.aggregate([
     { $match:{
        username: username?.toLowerCase()
      }},
      {
        $lookup:{
          from:"Subscription",
          localField:"_id",
          foreignField:"channel",
          as:"subscribedChannels"
        }
      },
      {
        $lookup:{
          from:"Subscription",
          localField:"_id",
          foreignField:"subscriber",
          as:"subscribers"

        }
      },
      {
        $addFields:{
          subscribersCount:{$size:"$subscribers"},
          subscribedChannelsCount:{$size:"$subscribedChannels"},
          isSubscribed:{
            $cond:{
             if:{$in:[req.user?._id,"$subscribers.subscriber"]},
             then:true,
             else:false
            }
          }
        }
      },
      {
        $project:{
          fullname:1,
          username:1,
          subscribersCount:1,
          channelAvatar:1,
          subscribedChannelsCount:1,
          isSubscribed:1,
          avatar:1,
          coverImage:1,
          email:1,
        }
      }
])



if (!channel?.length){
  throw new ApiError(404, "Channel not found with the provided username")
}
return res.status(200).json(
  new ApiResponse(200,
    channel[0],
    "Channel fetched successfully"
  )
)})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
{
  $match:{
    _id:new mongoose.Types.ObjectId(req.user?._id)
  }
},
{
  $lookup:{
    from:"videos",
    localField:"watchHistory",
    foreignField:"_id",
    as:"watchHistory",
    pipeline:[{
      $lookup:{
        from:"users",
        localField:"owner", 
        foreignField:"_id",
        as:"owner" ,
        pipeline:[{
          $project:{
            fullName:1,
            username:1,
            avatar:1,
          }
        }]
      }
    },{
      $addFields:{
        owner:{$arrayElemAt:["$owner", 0]}  
      }
    }]
  }
}
  ])

  return res.status(200).json(
    new ApiResponse(200,
      user[0]?.getWatchHistory,
      "Watch history fetched successfully"
    )
  )


})





export {registerUser, loginUser,logoutUser, refreshAccessToken,changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} 