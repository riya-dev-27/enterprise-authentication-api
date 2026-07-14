import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Verify SMTP connection
transporter.verify((error) => {
    if (error) {
        console.log("❌ Email configuration failed:", error.message);
    } else {
        console.log("✅ Email server is ready");
    }
});

const sendEmail = async ({ email, subject, html }) => {

    await transporter.sendMail({
        from: `"Enterprise Auth" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        html,
    });

};

export default sendEmail;