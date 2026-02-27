import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
})




export {registerUser}