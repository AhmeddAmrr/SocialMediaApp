import { EventEmitter } from "node:events";
import Mail from "nodemailer/lib/mailer";
import { template } from "../email/sendEmail.template";
import { sendEmail } from "../email/send.email";

export const emailEvent = new EventEmitter();

interface IEmail extends Mail.Options {
    otp : number;
    username:string;
    message:string;
}

emailEvent.on("confirmEmail" , async (data:IEmail) =>{
    try{
        data.subject = "Confirm Your Email";
        data.message = "Thanks for signing up! Use the verification code below to confirm your email address";
        data.html = template(data.otp , data.username , data.subject , data.message )
        await sendEmail(data)
    }
    catch(error){
        console.log(`Fail to send email ${error}`);
        
    }
})