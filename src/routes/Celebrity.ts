import { Router } from "express";
import { isAdmin, isLoggedIn } from "../middlewares/Auth";
import CelebrityController from "../controllers/Celebrity";
const router=Router()

// Create A celeb
router.post('/',[isLoggedIn, isAdmin], CelebrityController.addCelebrity )

// Edit Celeb
router.put('/:celebId',[isLoggedIn, isAdmin],CelebrityController.editCelebById )

// Get All Celebs
router.get('/',[isLoggedIn, isAdmin], CelebrityController.getAllCelebs)

// Get Celeb By Id
router.get('/:celebId',[isLoggedIn, isAdmin], CelebrityController.getCelebById)

// Delete Celeb By Id
router.delete('/:celebId',[isLoggedIn, isAdmin], CelebrityController.deleteCelebById)
export default router