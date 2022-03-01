import User from "../models/User";
import { Request, Response } from "express";
import Logger from "../providers/Logger";
import AWSService from "../services/AWS";
import Locals from "../providers/Locals";
// import processFileMiddleware from "../middlewares/Upload";
class Users{
    public static async editUser(req: Request, res: Response){
        try {
            console.log('Request Body is', req.body)
            const {name,password, bio, external_urls}=req.body
            // await processFileMiddleware(req, res);
            console.log("File is ", req.files)
            let foundUser= await User.findById(res.locals.userId)
            if(!foundUser){
                throw new Error('User Not Found')
            }
            if(name){
                foundUser.name=name
            }
            if(password){
                foundUser.password=password
            }
            if(bio){
                foundUser.bio=bio
            }
            if(external_urls){
                foundUser.external_urls=external_urls
            }
            if(Array.isArray(req.files)){
                for (const file of req.files) {
                    if(file.fieldname==='profile_pic'){
                        const image_url=await AWSService.uploadToS3Bucket(file, Locals.config().awsS3Bucket)
                        foundUser.avatar=image_url
                    }
                    if(file.fieldname==='profile_banner'){
                        const image_url=await AWSService.uploadToS3Bucket(file, Locals.config().awsS3Bucket)
                        foundUser.banner=image_url
                    }
                }
            }
            await foundUser.save()
            foundUser= await User.findById(res.locals.userId).select('-password')
            return res.status(200).json({message: 'User Updated Success', user: foundUser})
        } catch (err) {
            console.log(err)
            Logger.error(err)
            if(err instanceof Error){
                return res.status(500).json({message: 'Server Error', error: err.message})
            }else{
                return res.status(500).json({message: 'Server Error of Unhandledd Type'})
            }
        }
    }
    public static async getUserById(req: Request, res: Response){
        try{
            const {userId}=req.params
            const foundUser= await User.findById(userId).select('-password')
            if(!foundUser){
                throw new Error('User Not Found')
            }
            return res.status(200).json({message: 'Found User Is', user: foundUser})
        }catch(err){
            Logger.error(err)
            if(err instanceof Error){
                return res.status(500).json({message: 'Server Error', error: err.message})
            }else{
                return res.status(500).json({message: 'Server Error of Unhandledd Type'})
            }
        }
    }
    public static async getLoggedInUser(req: Request, res: Response){
        try{
            const foundUser=await User.findById(res.locals.userId).select('-password')
            return res.status(200).json({mesage: 'Succes', user: foundUser})
        }catch(err){
            Logger.error(err)
            if(err instanceof Error){
                return res.status(500).json({message: 'Server Error', error: err.message})
            }else{
                return res.status(500).json({message: 'Server Error of Unhandledd Type'})
            }
        }
    }
    public static async addWallet(req: Request, res: Response){

    }
}
export default Users