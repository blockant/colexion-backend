import { Router } from "express";
import NFTController from "../controllers/NFT";
import { isLoggedIn, decodeTokenIfLoggedIn, isAdmin } from "../middlewares/Auth";
import upload from "../middlewares/Upload";
const router=Router()

// Create an NFT
router.post('/upload', [isLoggedIn,isAdmin,upload.single('file')], NFTController.pinToIPFS)

// Edit A NFT
router.put('/', NFTController.updateNFTData)

//Like/Unlike an NFT
router.put('/:nftId/like', [isLoggedIn], NFTController.toggleLikeNFT)

//Add NFT To Wishlist
router.put('/:nftId/wish', [isLoggedIn], NFTController.addNFTToWishList)

//Get All NFT's
router.get('/',[decodeTokenIfLoggedIn], NFTController.getAllNFT)

//Get All Owned NFTs
router.get('/owned', NFTController.getOwnedNFT)

//Get NFT By Id
router.get('/:nftId',[decodeTokenIfLoggedIn], NFTController.getNFTById )
export default router