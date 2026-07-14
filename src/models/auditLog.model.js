import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        action: {
            type: String,
            required: true,
            enum: [
    "LOGIN",
    "LOGOUT",
    "CHANGE_PASSWORD",
    "UPDATE_PROFILE",
    "UPDATE_AVATAR",
    "DELETE_AVATAR",
    "DELETE_ACCOUNT",
    "UPDATE_ROLE",
    "ACTIVATE_USER",
    "DEACTIVATE_USER",
    "DELETE_USER",
    "RESTORE_USER"
]
        },

        details: {
            type: String,
            trim: true
        },

        ipAddress: {
            type: String
        },

        userAgent: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);