"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = void 0;
const socket_io_1 = require("socket.io");
const token_1 = require("../../utils/security/token");
const chat_gateway_1 = require("../chat/chat.gateway");
const initialize = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
        }
    });
    const connectedSockets = new Map();
    io.use(async (socket, next) => {
        try {
            const { user, decoded } = await (0, token_1.decodeToken)({
                authorization: socket.handshake.auth.authorization,
                tokenType: token_1.TokenEnum.ACCESS
            });
            const userTabs = connectedSockets.get(user._id.toString()) || [];
            userTabs.push(socket.id);
            connectedSockets.set(user._id.toString(), userTabs);
            socket.credentials = { user, decoded };
            next();
        }
        catch (error) {
            next(error);
        }
    });
    function disconnection(socket) {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user._id?.toString();
            let remainingTabs = connectedSockets.get(userId)?.filter((tab) => {
                return tab !== socket.id;
            }) || [];
            if (remainingTabs.length) {
                connectedSockets.set(userId, remainingTabs);
            }
            else {
                connectedSockets.delete(userId);
            }
            console.log(`after delete :: ${connectedSockets.get(userId)}`);
            console.log(connectedSockets);
        });
    }
    const chatGateway = new chat_gateway_1.ChatGateway();
    io.on("connection", (socket) => {
        console.log(connectedSockets);
        chatGateway.register(socket);
        disconnection(socket);
    });
};
exports.initialize = initialize;
