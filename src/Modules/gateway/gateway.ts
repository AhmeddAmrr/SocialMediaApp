import { Server as httpServer } from "node:http";
import { Server } from "socket.io";
import { decodeToken, TokenEnum } from "../../utils/security/token";
import { IAuthSocket } from "./gateway.dto";
import { ChatGateway } from "../chat/chat.gateway";




export const initialize = (httpServer : httpServer) =>{
     

    const io = new Server(httpServer , {
        cors: {
            origin: "*",
        }
    });
    
    const connectedSockets = new Map<string, string[]>();


    io.use( async (socket:IAuthSocket , next) =>{
        try {
            const { user , decoded } = await decodeToken({
                authorization: socket.handshake.auth.authorization,
                tokenType: TokenEnum.ACCESS
            });
            const userTabs = connectedSockets.get(user._id.toString()) || [];
            userTabs.push(socket.id);
            connectedSockets.set(user._id.toString() , userTabs);
            socket.credentials = { user , decoded} ;
            next();
        } catch (error:any) {
            next(error)
        }
        
    });
    function disconnection (socket:IAuthSocket){
            socket.on("disconnect" , () =>{
            const userId = socket.credentials?.user._id?.toString() as string ;
            let remainingTabs = connectedSockets.get(userId)?.filter((tab)=>{
                return tab !== socket.id;
            }) || [];
            if(remainingTabs.length){
                connectedSockets.set(userId , remainingTabs);
            }else{
                connectedSockets.delete(userId);
            }
            console.log(`after delete :: ${connectedSockets.get(userId)}`);
        console.log(connectedSockets);
            
        })
    }
    const chatGateway = new ChatGateway();
    io.on("connection", (socket: IAuthSocket) => {
        // console.log(socket.credentials?.user._id?.toString() as string );
        console.log(connectedSockets);
        chatGateway.register(socket);
        disconnection(socket);
    
    });

}