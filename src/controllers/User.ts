import User from "../models/User";
import { Request, Response } from "express";
import Logger from "../providers/Logger";
import AWSService from "../services/AWS";
import Locals from "../providers/Locals";
import ErrorHandler from "../providers/Error";
import Follows from "../models/Follower";
import ConnectedWallets from '../models/ConnectedWallets'
import IUser from "../interfaces/User";
// import processFileMiddleware from "../middlewares/Upload";
class Users{
    /**
     * @param {req, res} 
     * @returns Edited User
     * @desc Edits a logged in user based on ID
     */
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
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getLoggedInUser(req: Request, res: Response){
        try{
            const foundUser=await User.findById(res.locals.userId).select('-password')
            return res.status(200).json({mesage: 'Succes', user: foundUser})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async addWallet(req: Request, res: Response){
        try{
            const {wallet_address}=req.body
            const foundUser= await User.findById(res.locals.userId).select('-password')
            if(!foundUser){
                throw new Error('User Not Found')
            }
            const foundWallet=await ConnectedWallets.findOne({wallet_address: wallet_address})
            if(!foundWallet){
                await ConnectedWallets.create({wallet_address: wallet_address, connected_user: res.locals.userId})
            }else{
                throw new Error('Account associated with other user try with different account!')
            }
            return res.status(200).json({message: 'User Updated'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async toggleFollowUser(req: Request, res: Response){
        try{
            const {following_id, operation}=req.body
            if(operation==='FOLLOW'){
                const foundFollow=await Follows.findOne({follower: res.locals.userId, following: following_id})
                if(foundFollow){
                    throw new Error('User already follows this user')
                }else{
                    await Follows.create({follower: res.locals.userId, following: following_id})
                    return res.status(200).json({message: 'Success, followed Success'})
                }
            }else if(operation==='UNFOLLOW'){
                const foundFollow=await Follows.findOne({follower: res.locals.userId, following: following_id})
                if(!foundFollow){
                    throw new Error('User does not follows this user')
                }else{
                    await Follows.deleteOne({_id: foundFollow._id})
                    return res.status(200).json({message: 'Success, unfollowed Success'})
                }
            }else{
                throw new Error('Illegal Operation')
            }
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getFollowingInfo(req: Request, res: Response){
        try{
            const {following_id}=req.query
            const foundFollow=await Follows.findOne({follower: res.locals.userId, following: following_id})
            if(!foundFollow){
                return res.status(404).json({message: 'No follow Exist'})
            }else{
                return res.status(200).json({message: 'Follow exists'})
            }
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllUsers(req: Request, res: Response){
        try{
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                select: '-password'
            }
            if(req.query?.paginate==='false'){
                const foundUsers=await User.find({}).select('-password').select('-external_urls')
                return res.status(200).json({message: 'Users Found Success', foundUsers})
            }else{
                const foundUsers=await User.paginate({}, options)
                return res.status(200).json({message: 'Users Found Success', foundUsers})
            }
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async checkWalletConnected(req: Request, res: Response){
        try{
            const {wallet_address}=req.body
            if(!wallet_address){
                throw new Error('Insuffucient Fields')
            }
            const foundWallet=await ConnectedWallets.findOne({connected_user: res.locals.userId,wallet_address: wallet_address})
            if(!foundWallet){
                return res.status(200).json({walletFound: false})
            }
            return res.status(200).json({walletFound: true})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllWallets(req: Request, res: Response){
        try{
            const foundWallets=await ConnectedWallets.find({connected_user: req.params.userId})
            return res.status(200).json({foundWallets})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getUserByWalletAddress(wallet_address: string){
        try{
            const foundConnectedWallet=await ConnectedWallets.findOne({wallet_address: wallet_address}).populate('connected_user', 'name email _id ').lean()
            return foundConnectedWallet?.connected_user
        }catch(err){
            console.log(err)
        }
    }
}
export default Users