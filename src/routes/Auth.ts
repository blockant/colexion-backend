import { Router } from "express";
import Auth from "../controllers/Auth";
const router=Router()

// Register A User
router.post('/signup', Auth.signup)

// Login A User
router.post('/login', Auth.login)

//Signup Via Facebook
router.post('/signup/facebook', Auth.facebookSignup)

export default router