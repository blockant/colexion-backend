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
class NFTController{
    public static async createNFT(req: Request, res: Response){
        try{
            const {name, description, operation}=req.body
            // await processFileMiddleware(req, res);
            if(!req?.file){
                return res.status(400).json({ message: "Please upload a file!" });
            }
            const options = {
                pinataMetadata:{
                    name: req.file.originalname
                }
            }
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
                image: uploadedImageIPFSLink
            }
            //Upload MetaData To IPFS
            const nftResponse=await pinata.pinJSONToIPFS(nftMetaData)
            console.log('nft response', nftResponse)
            const nftModel=await NFT.create({
                content_hash: nftResponse.IpfsHash,
                onMarketPlace: false,
                file_url: uploadedImageIPFSLink
            })
            return res.status(200).json({message: 'Done', nft: nftModel})
        }catch(err){
            console.log(err)
            ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllNFT(req: Request, res: Response){
        try{
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10
            }
            if(req.query?.paginate==='false'){
                const foundNFTS=await NFT.find({})
                return res.status(200).json({message: 'NFTs Found Success', foundNFTS})
            }else{
                const foundNFTS=await NFT.paginate({}, options)
                return res.status(200).json({message: 'NFTs Found Success', foundNFTS})
            }
        }catch(err){
            ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async toggleLikeNFT(req: Request, res: Response){
        try{
            const nftId=req.params.nftId
            const foundNFT=await NFT.findById(nftId)
            if(!foundNFT){
                throw new Error('No Such NFT Exists')
            }
            const {operation}=req.body
            if(operation==='LIKE'){
                const foundIdx=foundNFT.liked_by.findIndex(user=>user.user_id===res.locals.userId.toString())
                if(foundIdx===-1){
                    foundNFT.liked_by.push({user_id: res.locals.userId.toString()})
                }else{
                    throw new Error('NFT Already Liked')
                }
            }else if(operation==='UNLIKE'){
                const foundIdx=foundNFT.liked_by.findIndex(user=>user.user_id===res.locals.userId.toString())
                if(foundIdx!==-1){
                    foundNFT.liked_by.splice(foundIdx, 1)
                }else{
                    throw new Error('NFT Not Liked')
                }
            }else{
                throw new Error('Illegal Operation')
            }
            return res.status(200).json({message: 'NFT Created Success', foundNFT})
        }catch(err){
            ErrorHandler.APIErrorHandler(err, res)
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
                }else{
                    throw new Error('NFT Already Wished')
                }
            }else if(operation==='UNWISH'){
                const foundIdx=foundNFT.wished_by.findIndex(user=>user.user_id===res.locals.userId.toString())
                if(foundIdx!==-1){
                    foundNFT.wished_by.splice(foundIdx, 1)
                }else{
                    throw new Error('NFT Not Liked')
                }
            }else{
                throw new Error('Illegal operation')
            }
            return res.status(200).json({message: 'NFT Created Success', foundNFT})
        }catch(err){
            ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default NFTController