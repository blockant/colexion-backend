import { Router } from "express";
import { isLoggedIn } from "../middlewares/Auth";
import Users from "../controllers/User";
const router=Router()

// Get Logged in User
router.get('/',[isLoggedIn], Users.getLoggedInUser)

// Edit User Info
router.put('/',[isLoggedIn], Users.editUser)

export default router