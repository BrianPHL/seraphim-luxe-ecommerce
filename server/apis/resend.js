import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_KEY);

export const sendEmail = async (data) => {
    const { response, error } = await resend.emails.send({
        from: data.from,
        to: data.to,
        subject: data.subject,
        html: data.html
    });
    return { response, error };
};
