import { Router } from "express";
import ActivityController from "../controllers/Activity";
const router=Router()

//To All Transaction History
router.get('/', ActivityController.getAllActivity)

//Get All Notifications
router.get('/notification', ActivityController.getAllNotifications)

export default router