import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {deleteFromCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import sendVerificationOTP from "../utils/sendVerificationOTP.js";
import sendResetPasswordOTP from "../utils/sendResetPasswordOTP.js";
import bcrypt from "bcrypt";
import { createAuditLog } from "../utils/createAuditLog.js";
import { cookieOptions } from "../utils/cookieOptions.js";





const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findOne({
    _id: userId,
    isActive: true,
    isDeleted: false,
});
if (!user) {
    throw new ApiError(404, "User not found");
}

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {

    console.log("Register API Hit");
  const { fullName, username, email, password } = req.body;
  if (
        [fullName, username, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });
    if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
}

const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
});
const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
);

if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
}

return res.status(201).json(
    new ApiResponse(
        201,
        createdUser,
        "User registered successfully"
    )
);

});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(email || username)) {
        throw new ApiError(400, "Email or username is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
    $or: [{ email }, { username }],
    isActive: true,
    isDeleted: false,
});

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    
    await createAuditLog({
    user: user._id,
    performedBy: user._id,
    action: "LOGIN",
    details: "User logged in successfully",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res 
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    );
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
            returnDocument: "after",
        }
    );




    await createAuditLog({
    user: req.user._id,
    performedBy: req.user._id,
    action: "LOGOUT",
    details: "User logged out successfully",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findOne({
    _id: decodedToken?._id,
    isActive: true,
    isDeleted: false,
});

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);


        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken,
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    await createAuditLog({
    user: req.user._id,
    performedBy: req.user._id,
    action: "CHANGE_PASSWORD",
    details: "Password changed successfully",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    );
});


const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email, username } = req.body;

    if (!fullName || !email || !username) {
        throw new ApiError(400, "All fields are required");
    }

    
    const existingUser = await User.findOne({
    _id: { $ne: req.user._id },
    isDeleted: false,
    $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
    ]
});

    if (existingUser) {
        throw new ApiError(409, "Email or username already exists");
    }

    const user = await User.findByIdAndUpdate(
    req.user._id,
        {
            $set: {
                fullName,
                email: email.toLowerCase(),
                username: username.toLowerCase(),
            },
        },
        {
            returnDocument: "after",
        }
    ).select("-password -refreshToken");


await createAuditLog({
    user: req.user._id,
    performedBy: req.user._id,
    action: "UPDATE_PROFILE",
    details: "Profile updated successfully",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(200, user, "Account updated successfully")
    );
});


const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Error while uploading avatar");
    }
       const user = await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            avatar: {
                url: avatar.secure_url,
                publicId: avatar.public_id,
            },
        },
    },
    {
        returnDocument: "after",
    }

    ).select("-password -refreshToken");

    await createAuditLog({
    user: req.user._id,
    performedBy: req.user._id,
    action: "UPDATE_AVATAR",
    details: "Avatar updated successfully",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    );
});


const deleteUserAvatar = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.avatar.publicId) {
        throw new ApiError(400, "Avatar not found");
    }

    await deleteFromCloudinary(user.avatar.publicId);

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: {
                    url: "",
                    publicId: "",
                },
            },
        },
        {
            returnDocument: "after",
        }
    ).select("-password -refreshToken");


    await createAuditLog({
    user: req.user._id,
    performedBy: req.user._id,
    action: "DELETE_AVATAR",
    details: "Avatar deleted successfully",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Avatar deleted successfully"
        )
    );

});

const deleteAccount = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id).select("avatar");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Delete avatar from Cloudinary if it exists
    if (user.avatar?.publicId) {

        const result = await deleteFromCloudinary(user.avatar.publicId);

        if (!result || result.result !== "ok") {
            throw new ApiError(
                500,
                "Failed to delete avatar from Cloudinary"
            );
        }
    }

    // Soft Delete User
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                isDeleted: true,
                isActive: false,
                deletedAt: new Date(),
            },
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
    secure: false,
};


await createAuditLog({
    user: req.user._id,
    performedBy: req.user._id,
    action: "DELETE_ACCOUNT",
    details: "User account deleted successfully",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "Account deleted successfully"
            )
        );
});


const sendVerificationEmail = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id);

if (!user) {
    throw new ApiError(404, "User not found");
}

if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
}

if (user.otp && user.otpExpiry && Date.now() < user.otpExpiry) {
    throw new ApiError(
        400,
        "Verification OTP has already been sent. Please use the resend verification API."
    );
}

    await sendVerificationOTP(user);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Verification OTP sent successfully"
        )
    );

});
const verifyEmail = asyncHandler(async (req, res) => {

    const { otp } = req.body;

    if (!otp) {
        throw new ApiError(400, "OTP is required");
    }

   const user = await User.findById(req.user._id).select(
    "isEmailVerified otp otpExpiry"
);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    if (!user.otp || !user.otpExpiry) {
        throw new ApiError(400, "Please request a new OTP");
    }

    if (Date.now() > user.otpExpiry) {
        throw new ApiError(400, "OTP has expired");
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
        throw new ApiError(400, "Invalid OTP");
    }

    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save({
        validateBeforeSave: false,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Email verified successfully"
        )
    );

});

const resendVerificationEmail = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id).select(
    "email fullName isEmailVerified otp otpExpiry"
);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, "Email is already verified");
    }

    await sendVerificationOTP(user);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Verification OTP resent successfully"
        )
    );

});


const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({
    email,
    isActive: true,
    isDeleted: false,
});
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(
            400,
            "Please verify your email before resetting your password"
        );
    }

    if (
        user.resetPasswordOtp &&
        user.resetPasswordOtpExpiry &&
        Date.now() < user.resetPasswordOtpExpiry
    ) {
        throw new ApiError(
            400,
            "Reset password OTP has already been sent. Please use the resend reset password OTP API."
        );
    }

    await sendResetPasswordOTP(user);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset OTP sent successfully"
        )
    );

});

const resendResetPasswordOTP = asyncHandler(async (req, res) => {

    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({
    email,
    isActive: true,
    isDeleted: false,
});

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user.isEmailVerified) {
        throw new ApiError(
            400,
            "Please verify your email before resetting your password"
        );
    }

    await sendResetPasswordOTP(user);

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Reset password OTP resent successfully"
        )
    );

});

const resetPassword = asyncHandler(async (req, res) => {

    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new ApiError(
            400,
            "Email, OTP and new password are required"
        );
    }

    const user = await User.findOne({
    email,
    isActive: true,
    isDeleted: false,
}).select(
    "+password resetPasswordOtp resetPasswordOtpExpiry"
);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (
        !user.resetPasswordOtp ||
        !user.resetPasswordOtpExpiry
    ) {
        throw new ApiError(
            400,
            "Please request a password reset OTP first"
        );
    }

    if (Date.now() > user.resetPasswordOtpExpiry) {
        throw new ApiError(
            400,
            "Reset password OTP has expired"
        );
    }

    const isOtpValid = await bcrypt.compare(
        otp,
        user.resetPasswordOtp
    );

    if (!isOtpValid) {
        throw new ApiError(400, "Invalid OTP");
    }

    user.password = newPassword;

    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;

    await user.save({
        validateBeforeSave: false,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset successfully"
        )
    );

});


export { registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    refreshAccessToken,
   changeCurrentPassword,
   updateAccountDetails,
   updateUserAvatar,
   deleteUserAvatar,
   deleteAccount,
   sendVerificationEmail,
   verifyEmail, 
   resendVerificationEmail,
   forgotPassword,
   resendResetPasswordOTP,
   resetPassword

 };