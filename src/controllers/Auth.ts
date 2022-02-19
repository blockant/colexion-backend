import User from "../models/User";
import Logger from "../providers/Logger";
import { Request, Response } from "express";
import JWT from "../providers/JWT";
class Auth{
    public static async signup(req : Request, res: Response){
        try{
            const {email, password, name}=req.body
            if(!email || !password || !name){
                throw new Error('Insufficient Fields while Signup')
            }
            // Find Existing User
            const foundUser=await User.findOne({email})
            if(foundUser){
                throw new Error('User Already Exists')
            }
            const newUser=new User({email, password, name})
            await newUser.save()
            return res.status(200).json({message: 'Signup Success', user: newUser})
        }catch(err){
            // tslint:disable-next-line:no-console
            console.log(err)
            Logger.error(err)
            if(err instanceof Error){
                return res.status(500).json({message: 'Server Error', error: err.message})
            }else{
                return res.status(500).json({message: 'Server Error of Unhandledd Type'})
            }
        }
    }
    public static async login(req: Request, res: Response){
        try{
            const {email, password}=req.body
            if(!email || !password){
                throw new Error('Insufficient Fields While Logging In')
            }
            let foundUser=await User.findOne({email})
            if(!foundUser){
                throw new Error('User with the Given Email Not Found')
            }
            if(!foundUser.authenticate(password)){
                throw new Error('Wrong Password')
            }
            const tokenObject=JWT.issueJWT(foundUser)
            foundUser=await User.findOne({email}).select('-password')
            return res.status(200).json({message: 'Login Success', token: tokenObject.token, user: foundUser})
        }catch(err){
            Logger.error(err)
            if(err instanceof Error){
                return res.status(500).json({message: 'Server Error', error: err.message})
            }else{
                return res.status(500).json({message: 'Server Error of Unhandledd Type'})
            }
        }
    }
}

export default Auth