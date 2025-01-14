import { Router } from "express";
import { isLoggedIn } from "../middlewares/Auth";
import Users from "../controllers/User";
import upload from "../middlewares/Upload";
const router=Router()

// Get Logged in User
router.get('/',[isLoggedIn], Users.getLoggedInUser)

// Edit User Info
router.put('/',[isLoggedIn, upload.any()], Users.editUser)

// Get all Users
router.get('/all', Users.getAllUsers)

//Follow Unfollow a User
router.post('/follow',[isLoggedIn], Users.toggleFollowUser)

//Get Following Info
router.get('/follow',[isLoggedIn],Users.getFollowingInfo)

//Get All Wallet
router.get('/wallet/:userId', Users.getAllWallets)

//Get User By Id
router.get('/:userId', Users.getUserById)

//Wallet 
router.put('/wallet', [isLoggedIn], Users.addWallet)

//Check Cureent Wallet Connect Status
router.put('/wallet/connect', [isLoggedIn], Users.checkWalletConnected)
export default router