import z from "zod";
import { signUpSchema } from "./auth.validation";


export type ISignupDTO = z.infer<typeof signUpSchema.body>;