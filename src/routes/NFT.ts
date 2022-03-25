import { Router } from "express";
import NFTController from "../controllers/NFT";
import { isLoggedIn, decodeTokenIfLoggedIn, isAdmin } from "../middlewares/Auth";
import upload from "../middlewares/Upload";
const router=Router()

// Create an NFT
router.post('/upload', [upload.single('file')], NFTController.pinToIPFS)

// Edit A NFT
router.put('/', NFTController.updateNFTData)

//Like/Unlike an NFT
router.put('/:nftId/like', [isLoggedIn], NFTController.toggleLikeNFT)

//Add NFT To Wishlist
router.put('/:nftId/wish', [isLoggedIn], NFTController.addNFTToWishList)

//Add NFT To Wishlist
router.put('/:nftId/owner/transfer', NFTController.transferNFTOwnership)

//Get All NFT's
router.get('/',[decodeTokenIfLoggedIn], NFTController.getAllNFT)

//Get All Owned NFTs
router.get('/owned',[decodeTokenIfLoggedIn], NFTController.getOwnedNFT)

//Check Owned Status of NFT
router.get('/:nftId/owned',[isLoggedIn], NFTController.checkOwnedNFT )

//Get NFT By Id
router.get('/:nftId',[decodeTokenIfLoggedIn], NFTController.getNFTById )
export default router