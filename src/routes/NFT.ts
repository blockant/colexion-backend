import { Router } from "express";
import NFTController from "../controllers/NFT";
import { isLoggedIn } from "../middlewares/Auth";
import upload from "../middlewares/Upload";
const router=Router()

//Create an NFT
router.post('/upload', [upload.single('file')], NFTController.createNFT)

router.get('/', NFTController.getAllNFT)

export default router