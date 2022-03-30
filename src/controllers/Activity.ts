import Activity from "../models/Activity"
import { Request, Response } from "express";
import ErrorHandler from "../providers/Error";

class ActivityController{
    public static async createActivity(description: string, sendTo: Array<Object> | string){
        try{
            const activityObject:any={
                description: description,
                isRead: false,
                receivers: (sendTo==='Broadcast')?(sendTo):(null)
            }
            //If Send To Is An Array of Multiple Users
            if(Array.isArray(sendTo) && sendTo.length>1){
                activityObject['type']='Group'
                //Todo Send To All Members of the group
            }else if(Array.isArray(sendTo) && sendTo.length===1){
                //Todo: Send To Specific Member
                activityObject['type']='Group'
            }else if(sendTo==='Broadcast'){
                //Todo Send To All the users of the platform
                activityObject['type']='Broadcast'
            }
            await Activity.create(activityObject)
            return {success: true}
        }catch(err){
            console.log(err)
            return {success: false}
        }
    }
    public static async getAllActivity(req: Request, res: Response){
        try{
            const options={
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10
            }
            const {nft_activity}=req.query
            const foundActivities=await Activity.paginate({}, options)
            return res.status(200).json({message: 'Success', activities: foundActivities})
        }catch(err){
            ErrorHandler.APIErrorHandler(err, res)
        }
    }
    public static async getActivityById(req: Request, res: Response){
        try{
            const foundActivity=await Activity.findById(req.params.activityId)
            if(foundActivity?.isRead===false){
                foundActivity.isRead=true
                await foundActivity.save()
            }
            return res.status(200).json({message: 'Success', activities: foundActivity})
        }catch(err){
            ErrorHandler.APIErrorHandler(err, res)
        }
    }
}
export default ActivityController