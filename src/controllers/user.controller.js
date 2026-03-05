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




export {registerUser, loginUser,logoutUser, refreshAccessToken}