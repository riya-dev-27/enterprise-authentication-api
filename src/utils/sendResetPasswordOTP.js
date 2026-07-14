import bcrypt from "bcrypt";
import generateOTP from "./generateOtp.js";
import sendEmail from "./sendEmail.js";

const sendResetPasswordOTP = async (user) => {

    // Generate OTP
    const otp = generateOTP();

    // Hash OTP
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Send Email
    await sendEmail({
        email: user.email,
        subject: "Reset Your Password",
        html: `
            <h2>Hello ${user.fullName},</h2>

            <p>Your Password Reset OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP is valid for 10 minutes.</p>

            <p>If you didn't request this, please ignore this email.</p>
        `,
    });

    // Save OTP after email is sent successfully
    user.resetPasswordOtp = hashedOTP;
    user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save({
        validateBeforeSave: false,
    });

};

export default sendResetPasswordOTP;