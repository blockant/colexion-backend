import { Request, Response } from "express";
import NFT from "../models/NFT";
import ErrorHandler from "../providers/Error";
import { create, urlSource } from 'ipfs-http-client'
// import processFileMiddleware from "../middlewares/Upload";
import Locals from "../providers/Locals";
import { UUID } from "bson";
import {Readable} from 'stream'
import pinata from "../services/Pinata";
import Web3 from "web3";
import HDWalletProvider from "@truffle/hdwallet-provider";
import AWSService from "../services/AWS";
import User from "../models/User";
class NFTController{
    public static async pinToIPFS(req: Request, res: Response){
        try{
            const {name, description, category}=req.body
            // await processFileMiddleware(req, res);
            if(!req?.file){
                return res.status(400).json({ message: "Please upload a file!" });
            }
            const options = {
                pinataMetadata:{
                    name: req.file.originalname
                }
            }
            const s3_url=await AWSService.uploadToS3Bucket(req.file, Locals.config().awsS3Bucket)
            const readableStream=Readable.from(req.file.buffer)
            //TODO: Fix this hack
            // @ts-ignore: Hack refered @ https://github.com/PinataCloud/Pinata-SDK/issues/28#issuecomment-816439078
            readableStream.path=new UUID().toString()
            //Upload Image To IPFS
            const response=await pinata.pinFileToIPFS(readableStream, options)
            const uploadedImageIPFSLink=`https://gateway.pinata.cloud/ipfs/${response.IpfsHash}`
            const nftMetaData={
                name: name,
                description: description,
                image: uploadedImageIPFSLink,
                category: category
            }
            //Upload MetaData To IPFS
            const nftResponse=await pinata.pinJSONToIPFS(nftMetaData)
            console.log('nft response', nftResponse)
            const nftModel=await NFT.create({
                content_hash: nftResponse.IpfsHash,
                onMarketPlace: false,
                file_url: uploadedImageIPFSLink,
                category: category,
                file_cloud_url: s3_url,
                name: name,
                description: description,
                file_type: req.file.mimetype
            })
            return res.status(200).json({message: 'Done', nft: nftModel})
        }catch(err){
            console.log(err)
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllNFT(req: Request, res: Response){
        try{
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                lean: true
            }
            const {category}=req.query
            const findQuery: Record<string,any>={}
            if(category){
                findQuery['category']=category
            }
            if(req.query?.paginate==='false'){
                let foundNFTS=await NFT.find(findQuery).lean()
                if(res.locals.userId){
                    foundNFTS=foundNFTS.map((nft)=>{
                        if(nft.liked_by.findIndex(user=>user.user_id===res.locals.userId)!==-1){
                            nft.liked_by_logged_in_user=true
                        }else{
                            nft.liked_by_logged_in_user=false
                        }
                        if(nft.wished_by.findIndex(user=>user.user_id===res.locals.userId)!==-1){
                            nft.wished_by_logged_in_user=true
                        }else{
                            nft.wished_by_logged_in_user=false
                        }
                        return nft
                    })          
                }
                return res.status(200).json({message: 'NFTs Found Success', foundNFTS})
            }else{
                const foundNFTS=await NFT.paginate(findQuery, options)
                if(res.locals.userId){
                    foundNFTS.docs=foundNFTS.docs.map((nft)=>{
                        if(nft.liked_by.findIndex((user: { user_id: any; })=>user.user_id===res.locals.userId)!==-1){
                            nft.liked_by_logged_in_user=true
                        }else{
                            nft.liked_by_logged_in_user=false
                        }
                        if(nft.wished_by.findIndex((user: { user_id: any; })=>user.user_id===res.locals.userId)!==-1){
                            nft.wished_by_logged_in_user=true
                        }else{
                            nft.wished_by_logged_in_user=false
                        }
                        return nft
                    }) 
                }
                return res.status(200).json({message: 'NFTs Found Success', foundNFTS})
            }
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async toggleLikeNFT(req: Request, res: Response){
        try{
            const nftId=req.params.nftId
            const foundNFT=await NFT.findById(nftId)
            if(!foundNFT){
                throw new Error('No Such NFT Exists')
            }
            let resp:any={}
            const {operation}=req.body
            if(operation==='LIKE'){
                const foundIdx=foundNFT.liked_by.findIndex(user=>user.user_id===res.locals.userId.toString())
                if(foundIdx===-1){
                    foundNFT.liked_by.push({user_id: res.locals.userId.toString()})
                    await foundNFT.save()
                    resp=foundNFT.toObject()
                    resp.liked_by_logged_in_user=true
                }else{
                    throw new Error('NFT Already Liked')
                }
            }else if(operation==='UNLIKE'){
                const foundIdx=foundNFT.liked_by.findIndex(user=>user.user_id===res.locals.userId.toString())
                if(foundIdx!==-1){
                    foundNFT.liked_by.splice(foundIdx, 1)
                    await foundNFT.save()
                    resp=foundNFT.toObject()
                    resp.liked_by_logged_in_user=false
                }else{
                    throw new Error('NFT Not Liked')
                }
            }else{
                throw new Error('Illegal Operation')
            }
            
            return res.status(200).json({message: 'NFT Updated Success', foundNFT: resp})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async addNFTToWishList(req: Request, res: Response){
        try{
            const nftId=req.params.nftId
            const foundNFT=await NFT.findById(nftId)
            if(!foundNFT){
                throw new Error('No Such NFT Exists')
            }
            const {operation}=req.body
            if(operation==='WISH'){
                const foundIdx=foundNFT.wished_by.findIndex(user=>user.user_id===res.locals.userId.toString())
                if(foundIdx===-1){
                    foundNFT.wished_by.push({user_id:res.locals.userId.toString()})
                    await foundNFT.save()
                }else{
                    throw new Error('NFT Already Wished')
                }
            }else if(operation==='UNWISH'){
                const foundIdx=foundNFT.wished_by.findIndex(user=>user.user_id===res.locals.userId.toString())
                if(foundIdx!==-1){
                    foundNFT.wished_by.splice(foundIdx, 1)
                    await foundNFT.save()
                }else{
                    throw new Error('NFT Not Liked')
                }
            }else{
                throw new Error('Illegal operation')
            }
            return res.status(200).json({message: 'NFT Updated Success', foundNFT})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getNFTById(req: Request, res: Response){
        try{
            const nftId=req.params.nftId
            const foundNFT=await NFT.findById(nftId).lean()
            if(!foundNFT){
                throw new Error('NFT Not Found')
            }
            if(res.locals.userId){
                if(foundNFT.liked_by.findIndex(user=>user.user_id===res.locals.userId)!==-1){
                    foundNFT.liked_by_logged_in_user=true
                }else{
                    foundNFT.liked_by_logged_in_user=false
                }
                if(foundNFT.wished_by.findIndex(user=>user.user_id===res.locals.userId)!==-1){
                    foundNFT.wished_by_logged_in_user=true
                }else{
                    foundNFT.wished_by_logged_in_user=false
                }
            }
            return res.status(200).json({message: 'Success', nft: foundNFT})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async markNFTMinted(req: Request, res: Response){
        try {
            const {transaction_hash, content_hash, blockId}=req.body

        } catch (err) {
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getOwnedNFT(req: Request, res: Response){
        try {
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                lean: true
            }
            const {user_id, category}=req.query
            if(!user_id){
                throw new Error('User Id is Required')
            }
            const foundUser= await User.findById(user_id).select('-password')
            if(!foundUser){
                throw new Error('No Logged in User Found')
            }
            const wallet_addresses=[]
            for (const wallet of foundUser.wallets) {
                wallet_addresses.push(wallet.address)
            }
            const findQuery: Record<string,any>={
                'owner_address': {'$in': wallet_addresses}
            }
            if(category){
                findQuery['category']=category
            }
            const foundNFTs=await NFT.paginate(findQuery, options)
            return res.status(200).json({message: 'Success', foundNFTs})
        } catch (err) {
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default NFTController