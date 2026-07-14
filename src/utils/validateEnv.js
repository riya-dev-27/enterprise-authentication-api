const requiredEnvVariables = [
    "PORT",
    "MONGODB_URI",
    "DB_NAME",

    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",

    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRY",

    "MAIL_HOST",
    "MAIL_PORT",
    "MAIL_USER",
    "MAIL_PASS",

    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",

    "CORS_ORIGIN",

];

export const validateEnv = () => {

    const missingVariables = requiredEnvVariables.filter(
        (variable) => !process.env[variable]
    );

    if (missingVariables.length > 0) {

        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );

    }

};