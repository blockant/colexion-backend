// This Index Router is the Master Router
import { Router } from "express";
import authRouter from './Auth'
import userRouter from './User'
import nftRouter from './NFT'
import upload from "../middlewares/Upload";
const router = Router()

// Adding All Auth Routes
router.use('/auth', authRouter)

// Adding All User Routes
router.use('/user', upload.any(), userRouter)

// Adding all NFT Routes Here
router.use('/nft', nftRouter)

export default router