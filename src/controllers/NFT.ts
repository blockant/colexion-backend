import { Request, Response } from "express";
import NFT from "../models/NFT";
import ErrorHandler from "../providers/Error";
import { create, urlSource } from 'ipfs-http-client'
// import processFileMiddleware from "../middlewares/Upload";
import Locals from "../providers/Locals";
import GoogleCloud from "../services/GoogleCloud";
import Events from "../services/Events";

class NFTController{
    public static async createNFT(req: Request, res: Response){
        try{
            const {contentHash}=req.body
            // await processFileMiddleware(req, res);
            if(!req?.file){
                return res.status(400).json({ message: "Please upload a file!" });
            }
            await GoogleCloud.uploadFileToBucket(req.file, Locals.config().gcpBucketName, 'nft-upload')
            Events.nftEvent.on('nft-s3-upload-success', async (publicUrl)=>{
                try{
                    console.log('Public Url after event is fired is ', publicUrl)
                    const ipfs = create()
                    const ipfsFile = await ipfs.add(urlSource(publicUrl))
                    console.log('Ipfs File is', ipfsFile)
                    return res.status(200).json({message: 'NFT Created Success'})
                }catch(err){
                    console.log(err)
                    ErrorHandler.APIErrorHandler(err, res)
                }
            })
            // const createdNFT=new NFT({content_hash: contentHash})
            // await createdNFT.save()
            
        }catch(err){
            ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllNFT(req: Request, res: Response){
        try{
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10
            }
            const foundNFTS=await NFT.paginate({}, options)
            return res.status(200).json({message: 'NFT Created Success', foundNFTS})
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
                    foundNFT.liked_by.push({user_id: res.locals.userId})
                }
            }
            return res.status(200).json({message: 'NFT Created Success', foundNFT})
        }catch(err){
            ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default NFTController