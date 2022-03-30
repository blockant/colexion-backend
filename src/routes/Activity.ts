import { Router } from "express";
import ActivityController from "../controllers/Activity";
const router=Router()

//To All Transaction History
router.get('/', ActivityController.getAllActivity)


export default router