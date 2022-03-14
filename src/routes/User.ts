import { Router } from "express";
import { isLoggedIn } from "../middlewares/Auth";
import Users from "../controllers/User";
import upload from "../middlewares/Upload";
const router = Router()

// Get Logged in User
router.get('/', [isLoggedIn], Users.getLoggedInUser)

// Get User Info by id
router.post('/id', Users.getUserById)

// Edit User Info
router.put('/', [isLoggedIn, upload.any()], Users.editUser)

// Get all Users
router.get('/all', Users.getAllUsers)

//Follow Unfollow a User
router.post('/follow', [isLoggedIn], Users.toggleFollowUser)

//Get Following Info
router.get('/follow', [isLoggedIn], Users.getFollowingInfo)
export default router