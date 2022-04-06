import User from "../models/User";
import Logger from "../providers/Logger";
import { Request, Response } from "express";
import axios from 'axios'
import JWT from "../providers/JWT";
import Locals from "../providers/Locals";
import { UUID } from "bson";
import ErrorHandler from "../providers/Error";
import AWSService from "../services/AWS";
import Encrypter from "../providers/Encrypter";
import {OAuth2Client} from 'google-auth-library'
import Celebrity from "../models/Celebrity";
const client = new OAuth2Client(Locals.config().CLIENT_ID)
class Auth{
    public static async signup(req : Request, res: Response){
        try{
            const {email, password, name, role}=req.body
            if(!email || !password || !name){
                throw new Error('Insufficient Fields while Signup')
            }
            // Find Existing User
            const foundUser=await User.findOne({email})
            if(foundUser){
                throw new Error('User Already Exists')
            }
            let newUser=new User({email, password, name})
            if(role){
                newUser.role=role
            }
            newUser=await newUser.save()
            const encryptedId=await Encrypter.encryptString(newUser._id.toString())
            //Do Not Await in case Email Service is not Working
            if(encryptedId){
                AWSService.sendEmail(newUser.email, `<p>Hey!</p>
                <p>You're almost ready to witness the best-ever NFTs at Colexion.
                Simply click on the link below to verify your email address.</p> 
                <a href='${Locals.config().url}/verify/${encryptedId}'>Verify Email</a>`, 
                'Colexion- Verify Email')
            }
            await Celebrity.updateOne({email: email, onboarded: false}, {'$set': {onboarded: true}})
            return res.status(200).json({message: 'Signup Success', user: newUser})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
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
            return ErrorHandler.APIErrorHandler(err, res)
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
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async facebookLogin(req: Request, res: Response){
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
            const foundUser=await User.findOne({email: response.data.email}).select('-password')
            if(foundUser){
                const tokenObject=JWT.issueJWT(foundUser)
                return res.status(200).json({message: 'Login Success', token: tokenObject.token, user: foundUser, source: 'facebook'})
            }else{
                throw new Error('User Not Found')
            }
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async verifyEmail(req: Request, res: Response){
        try{
            const {userId}=req.params
            if(!userId){
                throw new Error('User Id is required')
            }
            const decryptedId=await Encrypter.decryptString(userId)
            const foundUser=await User.findOne({_id: decryptedId, email_verified: false})
            if(!foundUser){
                throw new Error('No such user found, or email already verified')
            }
            await User.updateOne({_id: decryptedId}, {'$set': {email_verified: true}})
            return res.status(200).json({messsage: 'Email Verified Success'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async googleAuth(req: Request, res: Response){
        try{
            const { token }  = req.body
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: Locals.config().clientID
            });
            // console.log('Ticket payload is', ticket.getPayload())
            const { name, email }: any = ticket.getPayload();    
            const foundUser=await User.findOne({email: email})
            if(foundUser){
                const tokenObject=JWT.issueJWT(foundUser)
                return res.status(200).json({message: 'Login Success', token: tokenObject.token, user: foundUser})
            }else{
                const newUser=await User.create({email: email, name:name, password: new UUID()})
                // console.log('New User is', newUser)
                const encryptedId=await Encrypter.encryptString(newUser._id.toString())
                if(encryptedId){
                    AWSService.sendEmail(newUser.email, `<p>Hey!</p>
                    <p>You're almost ready to witness the best-ever NFTs at Colexion.
                    Simply click on the link below to verify your email address.</p> 
                    <a href='${Locals.config().url}/verify/${encryptedId}'>Verify Email</a>`, 
                    'Colexion- Verify Email')
                }
                const tokenObject=JWT.issueJWT(newUser)
                await Celebrity.updateOne({email: email, onboarded: false}, {'$set': {onboarded: true}})
                return res.status(200).json({message: 'Signup Success', token: tokenObject.token, user: await User.findById(newUser._id).select("-password"), source: 'google'})
            }
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
}

export default Auth