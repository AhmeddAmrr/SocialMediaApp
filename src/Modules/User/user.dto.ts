import { logOutSchema } from "./user.validation";
import z from "zod";



export type ILogoutDTO = z.infer<typeof logOutSchema.body>;