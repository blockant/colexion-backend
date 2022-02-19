// This Index Router is the Master Router
import { Router } from "express";
import authRouter from './Auth'
import userRouter from './User'
const router = Router()

// Adding All Auth Routes
router.use('/auth', authRouter)

// Adding All User Routes
router.use('/user', userRouter)

export default router