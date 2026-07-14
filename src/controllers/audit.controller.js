import mongoose from "mongoose";
import { AuditLog } from "../models/auditLog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getMyAuditLogs = asyncHandler(async (req, res) => {

    const logs = await AuditLog.find({
        user: req.user._id
    })
    .populate("performedBy", "fullName email role")
    .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(
            200,
            logs,
            "Audit logs fetched successfully"
        )
    );

});


const getAllAuditLogs = asyncHandler(async (req, res) => {

    const {
        page = 1,
        limit = 10,
        action,
        user,
        performedBy,
        sortBy = "createdAt",
        sortType = "desc",
    } = req.query;

    // Validate ObjectIds

    if (
        user &&
        !mongoose.Types.ObjectId.isValid(user)
    ) {
        throw new ApiError(
            400,
            "Invalid user id"
        );
    }

    if (
        performedBy &&
        !mongoose.Types.ObjectId.isValid(performedBy)
    ) {
        throw new ApiError(
            400,
            "Invalid performedBy id"
        );
    }

    // Pagination

    const pageNumber = Math.max(
        Number(page) || 1,
        1
    );

    const limitNumber = Math.max(
        Number(limit) || 10,
        1
    );

    const skip =
        (pageNumber - 1) * limitNumber;

    // Allowed Sorting

    const allowedSortFields = [
        "createdAt",
        "action",
    ];

    const finalSortBy =
        allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

    // Dynamic Match

    const matchStage = {};

    if (action) {
        matchStage.action = action;
    }

    if (user) {
        matchStage.user =
            new mongoose.Types.ObjectId(user);
    }

    if (performedBy) {
        matchStage.performedBy =
            new mongoose.Types.ObjectId(
                performedBy
            );
    }

        const auditLogs = await AuditLog.aggregate([

        {
            $match: matchStage,
        },

        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
            },
        },

        {
            $unwind: "$user",
        },

        {
            $lookup: {
                from: "users",
                localField: "performedBy",
                foreignField: "_id",
                as: "performedBy",
            },
        },

        {
            $unwind: "$performedBy",
        },

        {
            $project: {
                action: 1,
                details: 1,
                ipAddress: 1,
                userAgent: 1,
                createdAt: 1,

                user: {
                    _id: "$user._id",
                    fullName: "$user.fullName",
                    email: "$user.email",
                    role: "$user.role",
                },

                performedBy: {
                    _id: "$performedBy._id",
                    fullName: "$performedBy.fullName",
                    email: "$performedBy.email",
                    role: "$performedBy.role",
                },
            },
        },

        {
            $sort: {
                [finalSortBy]: sortType === "asc" ? 1 : -1,
            },
        },

        {
            $facet: {

                logs: [
                    {
                        $skip: skip,
                    },
                    {
                        $limit: limitNumber,
                    },
                ],

                totalLogs: [
                    {
                        $count: "count",
                    },
                ],

            },
        },

    ]);

        const logs = auditLogs[0]?.logs || [];

    const totalLogs =
        auditLogs[0]?.totalLogs?.length > 0
            ? auditLogs[0].totalLogs[0].count
            : 0;

    const totalPages = Math.ceil(totalLogs / limitNumber);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                logs,
                pagination: {
                    totalLogs,
                    totalPages,
                    currentPage: pageNumber,
                    limit: limitNumber,
                },
            },
            "Audit logs fetched successfully"
        )
    );

});


const getAuditStatistics = asyncHandler(async (req, res) => {

    const statistics = await AuditLog.aggregate([
        {
    $group: {

        _id: null,

        totalLogs: {
            $sum: 1,
        },

        loginCount: {
            $sum: {
                $cond: [
                    { $eq: ["$action", "LOGIN"] },
                    1,
                    0,
                ],
            },
        },

        logoutCount: {
            $sum: {
                $cond: [
                    { $eq: ["$action", "LOGOUT"] },
                    1,
                    0,
                ],
            },
        },

        passwordChanges: {
            $sum: {
                $cond: [
                    { $eq: ["$action", "CHANGE_PASSWORD"] },
                    1,
                    0,
                ],
            },
        },

        profileUpdates: {
            $sum: {
                $cond: [
                    { $eq: ["$action", "UPDATE_PROFILE"] },
                    1,
                    0,
                ],
            },
        },

        avatarUpdates: {
            $sum: {
                $cond: [
                    { $eq: ["$action", "UPDATE_AVATAR"] },
                    1,
                    0,
                ],
            },
        },

        avatarDeletions: {
            $sum: {
                $cond: [
                    { $eq: ["$action", "DELETE_AVATAR"] },
                    1,
                    0,
                ],
            },
        },

        accountDeletions: {
            $sum: {
                $cond: [
                    { $eq: ["$action", "DELETE_ACCOUNT"] },
                    1,
                    0,
                ],
            },
        },

        adminActions: {
            $sum: {
                $cond: [
                    {
                        $in: [
                            "$action",
                            [
                                "UPDATE_ROLE",
                                "ACTIVATE_USER",
                                "DEACTIVATE_USER",
                                "DELETE_USER",
                                "RESTORE_USER",
                            ],
                        ],
                    },
                    1,
                    0,
                ],
            },
        },

    },
},

{
    $project: {
        _id: 0,
        totalLogs: 1,
        loginCount: 1,
        logoutCount: 1,
        passwordChanges: 1,
        profileUpdates: 1,
        avatarUpdates: 1,
        avatarDeletions: 1,
        accountDeletions: 1,
        adminActions: 1,
    },
},

]);

const stats = statistics[0] || {
    totalLogs: 0,
    loginCount: 0,
    logoutCount: 0,
    passwordChanges: 0,
    profileUpdates: 0,
    avatarUpdates: 0,
    avatarDeletions: 0,
    accountDeletions: 0,
    adminActions: 0,
};

return res.status(200).json(
    new ApiResponse(
        200,
        stats,
        "Audit statistics fetched successfully"
    )
);



});

export {
    getMyAuditLogs,
    getAllAuditLogs,
    getAuditStatistics,
};