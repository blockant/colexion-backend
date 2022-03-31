import OTPModel from "../models/OTP";
import { Request, Response } from "express";
import ErrorHandler from "../providers/Error";
import User from "../models/User";
import otpGenerator from 'otp-generator' 
import AWSService from "../services/AWS";
import JWT from "../providers/JWT";
class OTPController{
    public static async sendOTP(req: Request, res: Response){
        try{
            const {email}=req.body
            const foundUser=await User.findOne({email})
            if(!foundUser){
                throw new Error('User Not Found')
            }
            //Length of OTP is 6
            const otp=otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });
            console.log('otp is', otp)
            const currentTime=new Date()
            //Keep Expiration Time of OTP as 15 minutes
            currentTime.setMinutes(currentTime.getMinutes()+ 15)
            await OTPModel.create({password: otp, expiry: currentTime, user_email: email})
            await AWSService.sendEmail(email, `<p>Hello!</p><p>We’ve received a reset password request from your account. If you wish to change your password click here to reset and enter otp: ${otp} </p><p>If you do not wish to change, no further action is required.</p> <p>Regards,</p>`, 'Colexion-Forgot Password')
            return res.status(200).json({message: 'Success'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async verifyOTP(req: Request, res: Response){
        try{
            const {otp, email}=req.body
            const foundOTPs=await OTPModel.find({email, expiry: {'$gte': new Date().toISOString()}})
            for (const foundOTP of foundOTPs) {
                if(foundOTP.verify(otp)){
                    let foundUser=await User.findOne({email})
                    if(foundUser){
                        const tokenObject=JWT.issueJWT(foundUser)
                        foundUser=await User.findOne({email}).select('-password')
                        return res.status(200).json({message: 'Login Success', token: tokenObject.token, user: foundUser})
                    }
                }
            }
            return res.status(404).json({message: 'No Valid OTP Found'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default OTPController