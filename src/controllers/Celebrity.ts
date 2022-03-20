import Celebrity from "../models/Celebrity";
import { Request, Response } from "express";
import ErrorHandler from "../providers/Error";
class CelebrityController{
    public static async addCelebrity(req: Request, res: Response){
        try{
            const {name, tier, category}=req.body
            const celeb=await Celebrity.create({name, tier, category})
            return res.status(200).json({message: 'Celebrity Added Success', celeb})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getAllCelebs(req: Request, res: Response){
        try{
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                lean: true
            }
            const foundCelebs=await Celebrity.paginate({}, options)
            return res.status(200).json({message: 'Success', foundCelebs})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async deleteCelebById(req: Request, res: Response){
        try{
            const {celebId}=req.params
            await Celebrity.deleteOne({_id: celebId})
            return res.status(200).json({message: 'Celebrity Deleted Success'})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getCelebById(req: Request, res: Response){
        try{
            const {celebId}=req.params
            const foundCeleb=await Celebrity.findById(celebId)
            return res.status(200).json({message: 'Found Celebrity', foundCeleb})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async editCelebById(req: Request, res: Response){
        try{
            const {celebId}=req.params
            const {name, tier, category}=req.body
            const foundCeleb=await Celebrity.findById(celebId)
            if(!foundCeleb){
                throw new Error('Celeb Not Found')
            }
            if(name){
                foundCeleb.name=name
            }
            if(tier){
                foundCeleb.tier=tier
            }
            if(category){
                foundCeleb.category=category
            }
            await foundCeleb.save()
            return res.status(200).json({message: 'Updated Celebrity', updatedCeleb: foundCeleb})
        }catch(err){
            return ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default CelebrityController