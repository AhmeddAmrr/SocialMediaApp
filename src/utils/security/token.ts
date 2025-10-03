import { JwtPayload, Secret, sign, SignOptions , verify}from "jsonwebtoken";
import { HUserDocument, RoleEnum, UserModel } from "../../DB/models/user.model";
import { BadRequestException, NotFoundException, UnAuthorizedException } from "../response/error.response";
import { UserRepository } from "../../DB/repositories/user.repository";
import { v4 as uuid }  from "uuid";
import { TokenModel } from "../../DB/models/token.model";
import { TokenRepository } from "../../DB/repositories/token.repository";


export enum SignatureEnum{
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum TokenEnum{
  ACCESS = "ACCESS",
  REFRESH = "REFRESH",
}

export enum logoutEnum{
  only = "ONLY",
  all = "ALL",
}



export const generateToken = async({
    payload ,
     secret = process.env.ACCESS_USER_SIGNATURE as string ,
      options=  {expiresIn: Number(process.env.ACCESS_EXPIRES_IN) }
    }: {
        payload:object ,
         secret?:Secret ,
          options?:SignOptions
        }) : Promise<string> =>{
    return await sign(payload , secret , options)
}

export const verifyToken = async({
    token ,
     secret = process.env.ACCESS_USER_SIGNATURE as string ,
    }: {
        token: string ,
         secret?:Secret ,
        }) : Promise<JwtPayload> =>{
    return await verify(token , secret  ) as JwtPayload;
}


export const getSignatureLevel  = async (role: RoleEnum = RoleEnum.USER) =>{
  let signatureLevel : SignatureEnum = SignatureEnum.USER;

  switch(role){
    case RoleEnum.ADMIN:
      signatureLevel = SignatureEnum.ADMIN;
      break;
    case RoleEnum.USER:
      signatureLevel = SignatureEnum.USER;  
      break;
      default:
        break;
  }

  return signatureLevel;
};


export const getSignature = async(signatureLevel: SignatureEnum = SignatureEnum.USER) =>{

  let signatures : {access_signature : string , refresh_signature : string } = {access_signature : "" , refresh_signature : "" };
  switch(signatureLevel){
    case SignatureEnum.ADMIN:
      signatures = { access_signature : process.env.ACCESS_ADMIN_SIGNATURE as string , refresh_signature : process.env.REFRESH_ADMIN_SIGNATURE as string};
      break;
    case SignatureEnum.USER:
      signatures = { access_signature : process.env.ACCESS_USER_SIGNATURE as string , refresh_signature : process.env.REFRESH_USER_SIGNATURE as string};
      break;
    default:
      signatures = { access_signature : process.env.ACCESS_USER_SIGNATURE as string , refresh_signature : process.env.REFRESH_USER_SIGNATURE as string};
      break;

  }
  return signatures;

}


export const createLoginCredentials = async (user:HUserDocument) =>{


      const signatureLevel = await getSignatureLevel(user.role);
      const signatures = await getSignature(signatureLevel);

      const jwtid = uuid();

      const accessToken = await generateToken({ 
        payload: { _id : user._id  } ,
         secret: signatures.access_signature ,
          options:{expiresIn: Number(process.env.ACCESS_EXPIRES_IN) , jwtid},
        })

      const refreshToken = await generateToken({ 
        payload: { _id : user._id } ,
          secret: signatures.refresh_signature ,
           options:{expiresIn: Number(process.env.REFRESH_EXPIRES_IN) , jwtid} ,
          })

      return { accessToken , refreshToken};


}

export const decodeToken = async({
  authorization ,
   tokenType = TokenEnum.ACCESS
  }:{
    authorization: string ;
    tokenType?: TokenEnum
  }) =>{

    const userModel= new UserRepository(UserModel);
    const tokenModel = new TokenRepository(TokenModel);
    const [bearer , token] = authorization.split(" ");
    if(!bearer || !token) throw new UnAuthorizedException("Missing Token Parts");

    const signatures = await getSignature(bearer as SignatureEnum);
    const signature = tokenType === TokenEnum.REFRESH ? signatures.refresh_signature : signatures.access_signature;

    const decoded = await verifyToken({ token , secret : signature});
    if(!decoded?._id || !decoded?.iat)
      throw new UnAuthorizedException("Invalid Token Payload");

    if(await tokenModel.findOne({
      filter : { jti : decoded.jti },
    }))
      throw new UnAuthorizedException("Token is Expired - Old Login Credentials");

    

    const user = await userModel.findOne({
      filter:{_id : decoded._id},
    });
    if(!user)
      throw new NotFoundException("Not Registered User");

    if(user.changeCredentialsTime?.getTime() ||  0  > decoded.iat * 1000 )
      throw new UnAuthorizedException("Token is Expired - Old Login Credentials");  


    return { user , decoded};
  }

export const createRevokeToken = async(decoded : JwtPayload) =>{
  const tokenModel = new TokenRepository(TokenModel);
 const results =  await tokenModel.create({
      data:[{ 
          jti: decoded?.jti as string,
          expiresIn: (decoded?.exp as number) + Number(process.env.REFRESH_EXPIRES_IN),
          userId: decoded?._id ,
      }
      ],
          options:{
                validateBeforeSave : true,
            }
        }) || [];

    if(!results) throw new BadRequestException("Token Revoking Failed");
    return results;
}