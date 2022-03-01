import { Router } from "express";
import NFTController from "../controllers/NFT";
import { isLoggedIn } from "../middlewares/Auth";
const router=Router()

router.post('/', [isLoggedIn], NFTController.createNFT)

export default router