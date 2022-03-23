import { Router } from "express";
import { isAdmin, isLoggedIn } from "../middlewares/Auth";
import BidController from "../controllers/Bid";
const router=Router()

//To Get All Bids on NFT
router.get('/', BidController.getAllBids)

//To Create A New Bid
router.post('/',[isLoggedIn], BidController.createANewBid)

//To Delete A Bid By Id
router.delete('/:bidId',[isLoggedIn], BidController.deleteBidById)

//To Edit Bid By Id
router.put('/:bidId',[isLoggedIn], BidController.editBidById)


export default router