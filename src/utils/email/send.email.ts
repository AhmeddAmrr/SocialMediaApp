import {createTransport, Transporter} from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const sendEmail = async(data: Mail.Options):Promise<void> =>{

    const transporter : Transporter<
    SMTPTransport.SentMessageInfo,
     SMTPTransport.Options> = createTransport({
        service:"gmail",
        auth:{
            user: process.env.EMAIL,
            pass:process.env.PASS
        }
    });

     await transporter.sendMail({
        ...data,
        from: `"SocialMediaApp" <${process.env.EMAIL}>`,
    })

}