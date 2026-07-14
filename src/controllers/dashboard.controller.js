import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getDashboardOverview = asyncHandler(async (req, res) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        deletedUsers,
        verifiedUsers,
        unverifiedUsers,
        adminUsers,
        normalUsers,
        newUsersToday,
        newUsersThisMonth,
    ] = await Promise.all([

        User.countDocuments({
            isDeleted: false,
        }),

        User.countDocuments({
            isActive: true,
            isDeleted: false,
        }),

        User.countDocuments({
            isActive: false,
            isDeleted: false,
        }),

        User.countDocuments({
            isDeleted: true,
        }),

        User.countDocuments({
            isEmailVerified: true,
            isDeleted: false,
        }),

        User.countDocuments({
            isEmailVerified: false,
            isDeleted: false,
        }),

        User.countDocuments({
            role: "admin",
            isDeleted: false,
        }),

        User.countDocuments({
            role: "user",
            isDeleted: false,
        }),

        User.countDocuments({
            createdAt: {
                $gte: today,
            },
            isDeleted: false,
        }),

        User.countDocuments({
            createdAt: {
                $gte: firstDayOfMonth,
            },
            isDeleted: false,
        }),

    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalUsers,
                activeUsers,
                inactiveUsers,
                deletedUsers,
                verifiedUsers,
                unverifiedUsers,
                adminUsers,
                normalUsers,
                newUsersToday,
                newUsersThisMonth,
            },
            "Dashboard overview fetched successfully"
        )
    );

});

const getUserAnalytics = asyncHandler(async (req, res) => {

    const analytics = await User.aggregate([
        {
            $match: {
                isDeleted: false,
            },
        },
        {
            $facet: {

                usersByRole: [
                    {
                        $group: {
                            _id: "$role",
                            totalUsers: {
                                $sum: 1,
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            role: "$_id",
                            totalUsers: 1,
                        },
                    },
                    {
                        $sort: {
                            totalUsers: -1,
                        },
                    },
                ],

                usersByVerification: [
                    {
                        $group: {
                            _id: "$isEmailVerified",
                            totalUsers: {
                                $sum: 1,
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            isEmailVerified: "$_id",
                            totalUsers: 1,
                        },
                    },
                ],

                usersByStatus: [
                    {
                        $group: {
                            _id: "$isActive",
                            totalUsers: {
                                $sum: 1,
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            isActive: "$_id",
                            totalUsers: 1,
                        },
                    },
                ],

            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            analytics[0],
            "User analytics fetched successfully"
        )
    );

});


const getRegistrationAnalytics = asyncHandler(async (req, res) => {

    const { type = "monthly" } = req.query;

    let groupStage = {};

    switch (type) {

        case "daily":
            groupStage = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
            };
            break;

        case "weekly":
            groupStage = {
                year: { $isoWeekYear: "$createdAt" },
                week: { $isoWeek: "$createdAt" },
            };
            break;

        case "yearly":
            groupStage = {
                year: { $year: "$createdAt" },
            };
            break;

        case "monthly":
        default:
            groupStage = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
            };
            break;
    }

    const registrationAnalytics = await User.aggregate([
        {
            $match: {
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: groupStage,
                totalUsers: {
                    $sum: 1,
                },
            },
        },
        {
            $project: {
                _id: 0,
                ...Object.keys(groupStage).reduce((acc, key) => {
                    acc[key] = `$_id.${key}`;
                    return acc;
                }, {}),
                totalUsers: 1,
            },
        },
        {
            $sort: {
                year: 1,
                month: 1,
                week: 1,
                day: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            registrationAnalytics,
            `${type} registration analytics fetched successfully`
        )
    );
});


const getRecentUsers = asyncHandler(async (req, res) => {

    const { limit = 2 } = req.query;

    const recentUsers = await User.find({
        isDeleted: false,
    })
        .select(
            "fullName username email avatar role isEmailVerified isActive createdAt"
        )
        .sort({
            createdAt: -1,
        })
        .limit(Number(limit))
        .lean();

    return res.status(200).json(
        new ApiResponse(
            200,
            recentUsers,
            "Recent users fetched successfully"
        )
    );

});
export {
    getDashboardOverview,
    getUserAnalytics,
    getRegistrationAnalytics,
    getRecentUsers
};