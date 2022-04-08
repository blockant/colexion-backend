import { Request, Response } from "express";
import NFT from "../models/NFT";
import Bid from "../models/Bid";
import ErrorHandler from "../providers/Error";
import User from "../models/User";
import ConnectedWallets from "../models/ConnectedWallets";
import Activity from "../models/Activity";
import ActivityController from "./Activity";
import AWSService from "../services/AWS";
import Users from "./User";
import Locals from "../providers/Locals";

class BidController{
    public static async createANewBid(req: Request, res: Response){
        try{
            const {nft_id, amount, wallet_address, quantity}=req.body
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
            if(foundNFT.contract_type==='ERC1155'){
                if(!quantity || (foundNFT.quantity && quantity>foundNFT.quantity))
                throw new Error(`Quantity Must Be provided > 0 and <= ${foundNFT.quantity}`)
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
            const foundBid=await Bid.findOne({wallet_address: wallet_address, nft: nft_id, accepted: false})
            if(foundBid){
                foundBid.amount=amount
                if(quantity && foundNFT.contract_type==='ERC1155' && foundNFT.quantity){
                    foundBid.quantity=quantity
                    //In case previous bid was Invalid Make it valid 
                    if(quantity<=foundNFT.quantity){
                        foundBid.invalid=false
                    }
                }
                await foundBid.save()
                let description: string=''
                if(quantity){
                    description=`${foundUser.name} updated their bid to ${amount} on ${foundNFT.name} for ${quantity} ${quantity>1? 'copies': 'copy'}`
                }else{
                    description=`${foundUser.name} updated their bid to ${amount} on ${foundNFT.name}`
                }
                await ActivityController.createActivityForGroups(description, res.locals.userId, nft_id)
                return res.status(200).json({message: 'Bid Updated Success', bid: foundBid})  
            }else{
                const bid=await Bid.create({amount, created_by: res.locals.userId, wallet_address, nft: nft_id, quantity: quantity})
                let description: string=''
                if(quantity){
                    description=`${foundUser.name} created a bid of ${amount} on ${foundNFT.name} for ${quantity} ${quantity>1? 'copies': 'copy'}`
                }else{
                    description=`${foundUser.name} created a bid of ${amount} on ${foundNFT.name}`
                }
                await ActivityController.createActivityForGroups(description, res.locals.userId, nft_id)
                const nftOwnerId=await Users.getUserByWalletAddress(foundNFT.owner_address)
                const nftOwner=await User.findById(nftOwnerId)
                if(nftOwner){
                    await AWSService.sendEmail(nftOwner.email, `<p>Get new bid updates straight to your inbox</p>
                    <p>We have a recent update for you. View active bids on your NFT <a href="${Locals.config().frontend_url}/item-details/${foundNFT._id}">here</a>.</p>`, `NFT- Bid Update`)
                }
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
            const foundUser=await User.findById(res.locals.userId)
            if(!foundUser){
                throw new Error('User Not Found')
            }
            console.log('Found User is', foundUser)
            const currentDate=new Date()
            currentDate.setMinutes(currentDate.getMinutes()-5)
            const foundBid: any=await Bid.findById(bidId).populate('nft', 'name _id price sale_type content_hash token_address').lean()
            if(foundBid.created_by.toString()!==res.locals.userId){
                throw new Error('The Bid was not created by the logged in user')
            }
            if(!foundBid){
                throw new Error('Bid Not Found')
            }
            const response=await Bid.deleteOne({_id: bidId, created_by: res.locals.userId, createdAt: {'$lte': currentDate.toISOString()}})
            if(response.deletedCount<1){
                throw new Error('Bid not found, or can not delete before 5 Minutes')
            }
            await ActivityController.createActivityForGroups(`${foundUser.name} withdrew their bid on ${foundBid.nft.name}`, res.locals.userId, foundBid.nft?._id)
            return res.status(200).json({message: 'Bid Delete Success'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    //TODO: Verify, probably this method is redundant
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