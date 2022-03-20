import { Router } from "express";
import CelebrityController from "../controllers/Celebrity";
const router=Router()

// Create A celeb
router.post('/', CelebrityController.addCelebrity )

// Edit Celeb
router.put('/:celebId',CelebrityController.editCelebById )

// Get All Celebs
router.get('/', CelebrityController.getAllCelebs)

// Get Celeb By Id
router.get('/:celebId', CelebrityController.getCelebById)

// Delete Celeb By Id
router.delete('/:celebId', CelebrityController.deleteCelebById)
export default router