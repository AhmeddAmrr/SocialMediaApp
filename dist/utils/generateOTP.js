"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = void 0;
const generateOTP = () => {
    return Math.floor(Math.random() * 1000000);
};
exports.generateOTP = generateOTP;
