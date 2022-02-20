import User from "../models/User";
import Logger from "../providers/Logger";
import { Request, Response } from "express";
import axios from 'axios'
import JWT from "../providers/JWT";
import Locals from "../providers/Locals";
import { UUID } from "bson";
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
    public static async facebookSignup(req: Request, res: Response){
        try{
            console.log('Request Body is', req.body)
            const {code}=req.body
            const {data} = await axios({
              url: 'https://graph.facebook.com/v13.0/oauth/access_token',
              method: 'get',
              params: {
                client_id: Locals.config().facebookAppId,
                client_secret: Locals.config().facebookAppSecret,
                redirect_uri: Locals.config().frontend_url,
                code,
              },
            });
            const fb_access_token=data.access_token
            console.log(data); // { access_token, token_type, expires_in }
            const response = await axios({
                url: 'https://graph.facebook.com/me',
                method: 'get',
                params: {
                  fields: ['email', 'first_name', 'last_name'].join(','),
                  access_token: fb_access_token,
                },
              });
            console.log('Graph Response is', response.data); // { id, email, first_name, last_name }
            const foundUser=await User.findOne({email: response.data.email})
            if(foundUser){
                throw new Error('Following User Already Exists')
            }else{
                const newUser=await User.create({email: response.data.email, name: response.data.first_name, password: new UUID()})
                console.log('New User is', newUser)
                const tokenObject=JWT.issueJWT(newUser)
                return res.status(200).json({message: 'Signup Success', token: tokenObject.token, user: await User.findById(newUser._id).select("-password"), source: 'facebook'})
            }
        }catch(err){
            // console.log(err)
            if(err instanceof Error){
                return res.status(500).json({message: 'Server Error', error: err.message})
            }else{
                return res.status(500).json({message: 'Server Error of Unhandledd Type'})
            }
        }
    }
}

export default Auth