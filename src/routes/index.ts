// This Index Router is the Master Router
import { Router } from "express";
import authRouter from './Auth'
import userRouter from './User'
import nftRouter from './NFT'
import celebRouter from './Celebrity'
import bidRouter from './Bid'
import activityRouter from './Activity'
const router = Router()

// Adding All Auth Routes
router.use('/auth', authRouter)

// Adding All User Routes
router.use('/user', userRouter)

// Adding all NFT Routes Here
router.use('/nft', nftRouter)

// All Celeb Routes
router.use('/celeb', celebRouter)

// All Bid Routes
router.use('/bid', bidRouter)

// All Activity Routes
router.use('/activity', activityRouter)
export default router