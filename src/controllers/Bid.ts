import { Request, Response } from "express";
import NFT from "../models/NFT";
import Bid from "../models/Bid";
import ErrorHandler from "../providers/Error";
import User from "../models/User";
import ConnectedWallets from "../models/ConnectedWallets";
class BidController{
    public static async createANewBid(req: Request, res: Response){
        try{
            const {nft_id, amount, wallet_address}=req.body
            if(amount<0){
                throw new Error('Amount Bust be greater than 0')
            }
            const foundNFT=await NFT.findOne({_id: nft_id, sale_type: {$ne: 'BUY'}})
            if(!foundNFT){
                throw new Error('Valid Auction/Open Bid NFT Not Found')
            }
            if(foundNFT.sale_type==='AUCTION' && amount< 1.1* Number(foundNFT.price)){
                throw new Error('Amount can\'t be less than 10% of base')
            }
            if(foundNFT.sale_type==='AUCTION'){
                const maxBid=await Bid.find({nft: nft_id}).sort({amount: -1}).limit(1)
                if(maxBid?.length>0 && amount< 1.1* Number(maxBid[0].amount)){
                    throw new Error('New Bid Must be Atleast Greater than 10% of max bid')
                }
            }
            const foundUser=await User.findById( res.locals.userId)
            if(!foundUser){
                throw new Error('User Not Found')
            }
            const foundWallet=await ConnectedWallets.findOne({connected_user: res.locals.userId, wallet_address: wallet_address})
            if(!foundWallet){
                throw new Error('Following wallet is not connected on user account')
            }
            //If Bid Already by this wallet already exists, updateIt
            const foundBid=await Bid.findOne({wallet_address: wallet_address, nft: nft_id})
            if(foundBid){
                foundBid.amount=amount
                await foundBid.save()
                return res.status(200).json({message: 'Bid Updated Success', bid: foundBid})  
            }else{
                const bid=await Bid.create({amount, created_by: res.locals.userId, wallet_address, nft: nft_id})
                return res.status(200).json({message: 'Bid Created Success', bid})  
            }
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllBids(req: Request, res: Response){
        try{
            //16:00
            const {nftId}=req.query
            if(!nftId){
                throw new Error('NFT Id Not Provided')
            }
            const foundNFT=await NFT.findById(nftId)
            if(!foundNFT){
                throw new Error('NFT Not Found')
            }
            // console.log('Logged In User Id',res.locals.userId )
            //Get all bids that were created 5 minutes ago.
            const currentDate=new Date()
            currentDate.setMinutes(currentDate.getMinutes()-5)
            //16:02
            const foundBids=await Bid.find({nft: nftId}).populate('created_by', 'name email _id avatar').populate('nft', 'name _id price sale_type content_hash token_address').lean()
            for (const bid of foundBids) {
                if(new Date(bid.updatedAt)>=currentDate){
                    bid.can_withdraw=false
                }else{
                    // console.log('Bid is', bid)
                    if(res.locals.userId && bid.created_by?._id?.toString()===res.locals.userId){
                        bid.can_withdraw=true
                    }else{
                        bid.can_withdraw=false
                    }
                }
            }            
            return res.status(200).json({message: 'Success', foundBids})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    //TODO: Bind 
    public static async deleteBidById(req: Request, res: Response){
        try{
            const {bidId}=req.params
            const currentDate=new Date()
            currentDate.setMinutes(currentDate.getMinutes()-5)
            const response=await Bid.deleteOne({_id: bidId, created_by: res.locals.userId, createdAt: {'$lte': currentDate.toISOString()}})
            if(response.deletedCount<1){
                throw new Error('Bid not found, or can not delete before 5 Minutes')
            }
            return res.status(200).json({message: 'Bid Delete Success'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async editBidById(req: Request, res: Response){
        try{
            const {bidId}=req.params
            const foundBid=await Bid.findOne({_id: bidId, created_by: res.locals.userId})
            if(!foundBid){
                throw new Error('No Bid Exists by this user')
            }
            const {amount}=req.body
            if(!amount){
                throw new Error('Amount > 0 is required')
            }
            foundBid.amount=amount
            await foundBid.save()
            return res.status(200).json({message: 'Success', updatedBid: foundBid})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default BidController