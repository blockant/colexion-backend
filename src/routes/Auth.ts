import { Router } from "express";
import OTPController from "../controllers/OTP";
import Auth from "../controllers/Auth";
const router=Router()

// Register A User
router.post('/signup', Auth.signup)

// Login A User
router.post('/login', Auth.login)

//Generate an OTP
router.post('/otp', OTPController.sendOTP)

//Verify OTP
router.post('/otp/verify', OTPController.verifyOTP)

//Signup Via Facebook
router.post('/signup/facebook', Auth.facebookSignup)

//Login Via Facebook
router.post('/login/facebook', Auth.facebookLogin)

//Login Via Google
router.post('/google', Auth.googleAuth)

//Verify Email
router.post('/verify/:userId', Auth.verifyEmail)
export default router