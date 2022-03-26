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
import ConnectedWallets from "../models/ConnectedWallets";
import OwnershipHistory from "../models/OwnershipHistory";
import Bid from "../models/Bid";
class NFTController{
    public static async pinToIPFS(req: Request, res: Response){
        try{
            console.log('req.body is', req.body)
            const {name, description, category}=req.body
            if(!name && !description && !category){
                throw new Error('Insufficient Fields')
            }
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
                lean: true,
                sort: {'createdAt': -1}
            }
            const {category, sale_type, live_auction, future_action, expired_auction, onMarketPlace}=req.query
            const findQuery: Record<string,any>={'minted': true}
            if(category){
                findQuery['category']=category
            }
            if(sale_type){
                findQuery['sale_type']=sale_type
            }
            if(live_auction && future_action && expired_auction){
                throw new Error('All Three Auction Types cant exist atleast two must be null/undefined')
            }
            if(live_auction){
                findQuery['auction_end_time']={'$gte': new Date().toISOString()}
                findQuery['auction_start_time']={'$lte': new Date().toISOString()}
            }
            if(future_action){
                findQuery['auction_start_time']={'$gte': new Date().toISOString()}
            }
            if(expired_auction){
                findQuery['auction_end_time']={'$lte': new Date().toISOString()}
            }
            if(onMarketPlace==="true"){
                findQuery['onMarketPlace']=true
            }else if(onMarketPlace==="false"){
                findQuery['onMarketPlace']=false
            }
            if(req.query?.paginate==='false'){
                let foundNFTS=await NFT.find(findQuery).lean().sort({'createdAt': -1})
                if(res.locals.userId){
                    foundNFTS=await Promise.all(foundNFTS.map(async (nft)=>{
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
                        if(nft.sale_type==='AUCTION'){
                            const maxBid=await Bid.find({nft: nft._id}).sort({amount: -1}).limit(1)
                            if(maxBid?.length===0){
                                nft.current_max_bid='No Bids Yet'
                            }else{
                                nft.current_max_bid=maxBid[0].amount.toString()
                            }
                        }
                        return nft
                    })) 
                }
                return res.status(200).json({message: 'NFTs Found Success', foundNFTS})
            }else{
                const foundNFTS=await NFT.paginate(findQuery, options)
                if(res.locals.userId){
                    const foundWallets=await ConnectedWallets.find({connected_user: res.locals.userId}).lean()
                    foundNFTS.docs=await Promise.all(foundNFTS.docs.map(async (nft)=>{
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
                        nft.owned_by_logged_in_user=foundWallets.findIndex(wallet=>wallet.wallet_address===nft.owner_address) !==-1 ? true: false
                        return nft
                    })) 
                }
                foundNFTS.docs=await Promise.all(foundNFTS.docs.map(async(nft)=>{
                    if(nft.sale_type==='AUCTION'){
                        const maxBid=await Bid.find({nft: nft._id}).sort({amount: -1}).limit(1)
                        if(maxBid?.length===0){
                            nft.current_max_bid='No Bids Yet'
                        }else{
                            nft.current_max_bid=maxBid[0].amount.toString()
                        }
                    }
                    return nft
                }))
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
            const foundWallet=await ConnectedWallets.findOne({wallet_address: foundNFT.owner_address}).populate('connected_user', 'name _id avatar').lean()
            if(!foundWallet){
                throw new Error('No Owner of this NFT or User Not Registered on platform')
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
            resp.created_by=foundWallet.connected_user
            const foundWallets=await ConnectedWallets.find({connected_user: res.locals.userId}).lean()
            resp.owned_by_logged_in_user=foundWallets.findIndex(wallet=>wallet.wallet_address===resp.owner_address) !==-1 ? true: false
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
            await NFT.updateOne({_id: nftId}, {'$inc': {views: 1}})
            const foundNFT=await NFT.findById(nftId).lean()
            const foundWallet=await ConnectedWallets.findOne({wallet_address: foundNFT?.owner_address}).populate('connected_user', 'name _id avatar').lean()
            if(!foundWallet){
                throw new Error('NFT minted on this wallet, is not connected on the platform')
            }
            if(!foundNFT){
                throw new Error('NFT Not Found')
            }
            foundNFT.created_by=foundWallet.connected_user
            if(res.locals.userId){
                const connectedUserWallets=await ConnectedWallets.find({connected_user: res.locals.userId})
                foundNFT.owned_by_logged_in_user= connectedUserWallets.findIndex(wallet=>wallet.wallet_address===foundNFT.owner_address) !==-1 ? true: false
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
            const {user_id, category, sale_type}=req.query
            if(!user_id){
                throw new Error('User Id is Required')
            }
            const foundWallets=await ConnectedWallets.find({connected_user: user_id})
            const wallet_addresses=[]
            for (const wallet of foundWallets) {
                wallet_addresses.push(wallet.wallet_address)
            }
            // console.log('Wallet Addresses is', wallet_addresses)
            const findQuery: Record<string,any>={
                'owner_address': {'$in': wallet_addresses}
            }
            if(category){
                findQuery['category']=category
            }
            if(sale_type){
                findQuery['sale_type']=sale_type
            }
            const foundNFTs=await NFT.paginate(findQuery, options)
            if(res.locals.userId){
                const foundWallets=await ConnectedWallets.find({connected_user: res.locals.userId}).lean()
                foundNFTs.docs=foundNFTs.docs.map((nft)=>{
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
                    nft.owned_by_logged_in_user=foundWallets.findIndex(wallet=>wallet.wallet_address===nft.owner_address) !==-1 ? true: false
                    return nft
                }) 
            }
            return res.status(200).json({message: 'Success', foundNFTs})
        } catch (err) {
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    //TODO: Add Respective Validations
    public static async updateNFTData(req: Request, res: Response){
        try {
            console.log('req.body is', req.body)
            const {
                content_hash,
                tokenId, 
                owner_address,
                onMarketPlace,
                price,
                token_address,
                sale_type, 
                auction_end_time, 
                auction_start_time, 
                orderId,
                claimed,
                contract_type,
                deployed_network,
                quantity
            }=req.body
            if(!content_hash){
                throw new Error('Insufficient Fields (content_hash) is must')
            }
            const foundNFT=await NFT.findOne({content_hash: content_hash})
            if(!foundNFT){
                throw new Error('NFT Not Found')
            }
            if(!foundNFT?.tokenId && !tokenId){
                throw new Error('Token Id Must Be Provided')
            }
            if(foundNFT.onMarketPlace===true){
                throw new Error('Can not mutate nft once published on marketplace')
            }
            if(tokenId){
                if(foundNFT.tokenId){
                    throw new Error('Token Id Can\'t be mutated, NFT with same content Hash Already Exists')
                }else{
                    foundNFT.tokenId=tokenId
                    foundNFT.minted=true
                }
            }
            if(contract_type){
                foundNFT.contract_type=contract_type
            }
            if(deployed_network){
                foundNFT.deployed_network=deployed_network
            }
            if(quantity){
                foundNFT.quantity=quantity
            }
            if(orderId){
                foundNFT.orderId=orderId
            }
            if(owner_address){
                await OwnershipHistory.create({nft: foundNFT._id, new_owner_address: owner_address, previous_owner_address: foundNFT.owner_address})
                foundNFT.owner_address=owner_address
            }
            if(typeof onMarketPlace==="boolean"){
                if(foundNFT.onMarketPlace){
                    if(typeof claimed==="boolean" && claimed===true){
                        foundNFT.claimed=true
                        foundNFT.onMarketPlace=false
                    }
                }else{
                    foundNFT.onMarketPlace=onMarketPlace
                }
            }
            if(price){
                foundNFT.price=price
            }
            if(token_address){
                foundNFT.token_address=token_address
            }
            if(sale_type){
                if(sale_type==='AUCTION'){
                    foundNFT.claimed=false
                    foundNFT.to_be_claimed_by='0x0000000000000000000000000000000000000000'
                }
                foundNFT.sale_type=sale_type
            }
            if(auction_end_time){
                foundNFT.auction_end_time=auction_end_time
            }
            if(auction_start_time){
                foundNFT.auction_start_time=auction_start_time
            }
            await foundNFT.save()
            return res.status(200).json({message: 'Update Success', updatedNFT: foundNFT})
        } catch (err) {
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async checkOwnedNFT(req: Request, res: Response){
        try{
            const {nftId}=req.params
            const foundWallets=await ConnectedWallets.find({connected_user: res.locals.userId}).lean()
            if(foundWallets?.length){
                throw new Error('No Wallets Found')
            }
            const foundNFT=await NFT.findById(nftId)
            if(!foundNFT){
                throw new Error('NFT Not found')
            }
            const owner_address=foundNFT.owner_address
            if(foundWallets.findIndex(wallet=>wallet.wallet_address===owner_address)===-1){
                throw new Error('Wallet Not Connected')
            }
            return res.status(200).json({message: 'Success, NFT Owned'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async transferNFTOwnership(req: Request, res: Response){
        try{
            //Whenever Ownership is transfered
            const {nftId}=req.params
            const {owner_address}=req.body
            const foundNFT=await NFT.findById(nftId)
            if(!foundNFT){
                throw new Error('NFT Not Found')
            }
            if(owner_address){
                if(foundNFT.sale_type==='AUCTION' || foundNFT.sale_type==='OPEN BIDS'){
                    await Bid.deleteMany({nft: nftId})
                    if(foundNFT.sale_type==='AUCTION'){
                        foundNFT.to_be_claimed_by='0x0000000000000000000000000000000000000000'
                    }
                }
                await OwnershipHistory.create({nft: foundNFT._id, new_owner_address: owner_address, previous_owner_address: foundNFT.owner_address})
                if(foundNFT.onMarketPlace){
                    await NFT.updateOne({_id: nftId}, {'$set': {owner_address: owner_address, onMarketPlace: false}, '$unset': {sale_type: ""}})
                }
            }else{
                throw new Error('Owner Address Is Required')
            }
            const updatedNFT=await NFT.findById(nftId)
            return res.status(200).json({message: 'Transfered Ownership Success', updatedNFT})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllNFTToBeClaimed(req: Request, res: Response){
        try{
            const foundWallets=await ConnectedWallets.find({connected_user: res.locals.userId}).lean()
            if(!foundWallets){
                throw new Error('This User Has Not Connected Any Wallets')
            }
            const wallet_addresses=[]
            for (const wallet of foundWallets) {
                wallet_addresses.push(wallet.wallet_address)
            }
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                lean: true,
                sort: {'updatedAt': -1}
            }
            const findQuery={
                'to_be_claimed_by':{'$in': wallet_addresses}
            }
            const foundNFTs=await NFT.paginate(findQuery, options)
            return res.status(200).json({message: 'Transfered Ownership Success', foundNFTs})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default NFTController