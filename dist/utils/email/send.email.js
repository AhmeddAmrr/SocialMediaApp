"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = require("nodemailer");
const sendEmail = async (data) => {
    const transporter = (0, nodemailer_1.createTransport)({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    });
    await transporter.sendMail({
        ...data,
        from: `"SocialMediaApp" <${process.env.EMAIL}>`,
    });
};
exports.sendEmail = sendEmail;
