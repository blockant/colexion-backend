import { Router } from "express";
import Auth from "../controllers/Auth";
const router=Router()

// Register A User
router.post('/signup', Auth.signup)

// Login A User
router.post('/login', Auth.login)

export default router