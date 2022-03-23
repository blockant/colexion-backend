import { Request, Response } from "express";
import NFT from "../models/NFT";
import Bid from "../models/Bid";
import ErrorHandler from "../providers/Error";
import User from "../models/User";
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
            if(amount<foundNFT.price){
                throw new Error('Amount can\'t be less than base')
            }
            if(foundNFT.sale_type==='AUCTION'){
                const maxBid=await Bid.find({nft: nft_id}).sort({amount: -1}).limit(1)
                // if(max)
            }
            const foundUser=await User.findById( res.locals.userId)
            if(!foundUser){
                throw new Error('User Not Found')
            }
            if(foundUser.wallets.findIndex(wallet=>wallet.address===wallet_address)===-1){
                throw new Error('Given User Does not have the provided wallet Connected In His Account')
            }
            const bid=await Bid.create({amount, created_by: res.locals.userId, wallet_address, nft: nft_id})
            return res.status(200).json({message: 'Bid Created Success', bid})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllBids(req: Request, res: Response){
        try{
            const {nftId}=req.query
            if(!nftId){
                throw new Error('NFT Id Not Provided')
            }
            const foundBids=await Bid.find({nft: nftId}).populate('created_by', 'name email _id avatar').populate('nft', 'name _id price sale_type content_hash')
            return res.status(200).json({message: 'Success', foundBids})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async deleteBidById(req: Request, res: Response){
        try{
            const {bidId}=req.params
            await Bid.deleteOne({_id: bidId, created_by: res.locals.userId})
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