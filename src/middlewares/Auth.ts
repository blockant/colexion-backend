// The Following middleware Checks if current user is logged in Or Not
import { Request, Response, NextFunction } from "express";
import JWT from "../providers/JWT";
import Logger from "../providers/Logger";
import jwt from 'jsonwebtoken'
import Locals from "../providers/Locals";
import ErrorHandler from "../providers/Error";
export const isLoggedIn= (req: Request, res: Response, next: NextFunction)=>{
    try{
        if(!req.headers.authorization){
            throw new Error('No Token Sent')
        }
        const decoded = jwt.verify(JWT.getToken(req), Locals.config().jwtSecretKey);
        res.locals.userId=decoded.sub
        next()
    }catch(err){
        return ErrorHandler.APIErrorHandler(err, res)
    }
}
export const decodeTokenIfLoggedIn=(req: Request, res: Response, next: NextFunction)=>{
    try{
        if(!req.headers.authorization){
            next()
        }else{
            const decoded = jwt.verify(JWT.getToken(req), Locals.config().jwtSecretKey);
            res.locals.userId=decoded.sub
            next()
        }
    }catch(err){
        return ErrorHandler.APIErrorHandler(err, res)
    }
}