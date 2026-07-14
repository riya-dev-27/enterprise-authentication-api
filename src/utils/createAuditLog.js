import { AuditLog } from "../models/auditLog.model.js";

export const createAuditLog = async ({
    user,
    performedBy,
    action,
    details,
    ipAddress,
    userAgent
}) => {
    try {
        await AuditLog.create({
            user,
            performedBy,
            action,
            details,
            ipAddress,
            userAgent
        });
    } catch (error) {
        console.error("Audit Log Error:", error);
    }
};