import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password, phoneno,role } = req.body;

  if (!fullName || !email || !username || !password || !phoneno ||!role) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const user = new User({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    phoneno,
    role
  });
  await user.save();

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email ) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({
    $or: [{ email }],
  })

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );



  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, { loggedInUser, accessToken, refreshToken }, "Login successful")
    );
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");
  res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  const user = await User.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decoded._id);

    if (!user || incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed")
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

const logoutUser = asyncHandler(async (req, res) => {


  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "Logout  successful"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  console.log(req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});


const changeStandard = asyncHandler(async (req, res) => {
  try {
    const { standard } = req.body;
    
    // Validation checks
    if (!standard) {
      throw new ApiError(400, "Standard is required");
    }

    // Validate standard format (assuming standards are numbers between 1-12)
    if (!Number.isInteger(Number(standard)) || standard < 1 || standard > 12) {
      throw new ApiError(400, "Invalid standard. Must be between 1 and 12");
    }

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { standard },
      {
        new: true,
        runValidators: true
      }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200, 
        updatedUser, 
        "Standard updated successfully"
      ));

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      500, 
      "Something went wrong while updating standard",
      error
    );
  }
});


const GoogleloginUser = asyncHandler(async (req, res) => {

  const {token} =req.body;

  const client=new OAuth2Client(process.env.CLIENT_ID)

  const ticket=await client.verifyIdToken({
   idToken: token,audience:process.env.CLIENT_ID
  })

  const payload=ticket.getPayload()

  const { email } = payload;

  if (!email ) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({
    $or: [{ email }],
  })

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, { loggedInUser, accessToken, refreshToken }, "Login successful")
    );
});


export {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  changeStandard,
  GoogleloginUser
};
