import { Router } from "express";
import NFTController from "../controllers/NFT";
import { isLoggedIn } from "../middlewares/Auth";
import upload from "../middlewares/Upload";
const router=Router()

router.post('/', [isLoggedIn, upload.single('nft')], NFTController.createNFT)

export default router