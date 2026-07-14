import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
fullName: {
            type: String,
            required: true,
            trim: true,
        },
                username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
                email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
          type: String,
          required: true,
        },
        role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
},
refreshToken: {
    type: String,
},

avatar: {
    url: {
        type: String,
        default: "",
    },
    publicId: {
        type: String,
        default: "",
    },
},
isEmailVerified: {
    type: Boolean,
    default: false,
},
isActive: {
    type: Boolean,
    default: true,
},

isDeleted: {
    type: Boolean,
    default: false,
},

deletedAt: {
    type: Date,
    default: null,
},

 otp: {
            type: String,
            default: "",
        },

        otpExpiry: {
            type: Date,
        },

        resetPasswordOtp: {
    type: String,
    default: null,
},

resetPasswordOtpExpiry: {
    type: Date,
    default: null,
},

    },
    {
        timestamps: true,
    }
);
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};


userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};


export const User = mongoose.model("User", userSchema);