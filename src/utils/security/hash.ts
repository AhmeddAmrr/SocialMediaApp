import {hash , compare} from "bcrypt";

export const generateHash = async (
    plainText:string,
    saltRound:number = Number(process.env.SALT as string )
):Promise<string> =>{
    return await hash (plainText , saltRound)
}

export const compareHash = async (
    plainText:string,
    hash:string
):Promise<boolean> =>{
    return await compare (plainText , hash)
}