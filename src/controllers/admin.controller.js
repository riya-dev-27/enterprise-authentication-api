import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";


const getAllUsers = asyncHandler(async (req, res) => {

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search
    const search = req.query.search || "";

    // Filters
    const role = req.query.role;
    const isActive = req.query.isActive;

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Base Filter
    const filter = {
        isDeleted: false,
    };

    // Search Filter
    if (search) {
        filter.$or = [
            {
                fullName: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                username: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                email: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }

    // Role Filter
    if (role) {
        filter.role = role;
    }

    // Active Filter
    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }

    // Fetch Users
    const users = await User.find(filter)
        .select("-password -refreshToken")
        .sort({
            [sortBy]: sortOrder,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    // Total Users
    const totalUsers = await User.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                users,
                pagination: {
                    totalUsers,
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    limit,
                },
            },
            "Users fetched successfully"
        )
    );

});
const getUserById = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const user = await User.findOne({
        _id: userId,
       isDeleted: false,
    })
        .select("-password -refreshToken")
        .lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User fetched successfully"
        )
    );

});


const updateUserRole = asyncHandler(async (req, res) => {

    const { userId } = req.params;
    const { role } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    // Validate Role
    if (!role) {
        throw new ApiError(400, "Role is required");
    }

    const allowedRoles = ["USER", "ADMIN"];

    if (!allowedRoles.includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    // Prevent self role update
    if (req.user._id.toString() === userId) {
        throw new ApiError(
            403,
            "You cannot change your own role"
        );
    }

    // Find User
    const user = await User.findOne({
    _id: userId,
    isDeleted: false,
})

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Active account check
    if (!user.isActive) {
        throw new ApiError(
            400,
            "User account is inactive"
        );
    }

    // Same role check
    if (user.role === role) {
        throw new ApiError(
            400,
            `User is already ${role}`
        );
    }

    // Update role
    user.role = role;

    await user.save({
        validateBeforeSave: false,
    });


    await createAuditLog({
    user: user._id,
    performedBy: req.user._id,
    action: "UPDATE_ROLE",
    details: `Role updated to ${user.role}`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
            "User role updated successfully"
        )
    );

});

const updateUserStatus = asyncHandler(async (req, res) => {

    const { userId } = req.params;
    const { isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    // Validate Boolean
    if (typeof isActive !== "boolean") {
        throw new ApiError(400, "isActive must be true or false");
    }

    // Prevent self update
    if (req.user._id.toString() === userId) {
        throw new ApiError(
            403,
            "You cannot change your own account status"
        );
    }

    // Find User
    const user = await User.findOne({
    _id: userId,
    isDeleted: false,
})

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Already same status
    if (user.isActive === isActive) {
        throw new ApiError(
            400,
            `User is already ${isActive ? "active" : "inactive"}`
        );
    }

    // Update status
    user.isActive = isActive;

    await user.save({
        validateBeforeSave: false,
    });

    await createAuditLog({
    user: user._id,
    performedBy: req.user._id,
    action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    details: `User ${isActive ? "activated" : "deactivated"} by admin`,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                isActive: user.isActive,
            },
            `User ${isActive ? "activated" : "deactivated"} successfully`
        )
    );

});



const deleteUser = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    // Prevent self delete
    if (req.user._id.toString() === userId) {
        throw new ApiError(
            403,
            "You cannot delete your own account"
        );
    }

    // Find user
    const user = await User.findOne({
        _id: userId,
        isDeleted: false,
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Already deleted (extra safety)
    if (user.isDeleted) {
        throw new ApiError(400, "User is already deleted");
    }

    // Soft delete
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false;

    await user.save({
        validateBeforeSave: false,
    });

    await createAuditLog({
    user: user._id,
    performedBy: req.user._id,
    action: "DELETE_USER",
    details: "User deleted by admin",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "User deleted successfully"
        )
    );

});


const restoreUser = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const user = await User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: true,
        },
        {
            $set: {
                isDeleted: false,
                isActive: true,
                deletedAt: null,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "Deleted user not found");
    }

    await createAuditLog({
    user: user._id,
    performedBy: req.user._id,
    action: "RESTORE_USER",
    details: "User restored by admin",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
});

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "User restored successfully"
        )
    );

});
export {
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    restoreUser
};