import Activity from "../models/Activity"
import { Request, Response } from "express";
import ErrorHandler from "../providers/Error";
//Send Interval To Get All Activity
const SEND_INTERVAL = 2000;
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
            // const options={
            //     page: Number(req.query.page) || 1,
            //     limit: Number(req.query.limit) || 10
            // }
            const {nft_content_hash}=req.query
            if(nft_content_hash){
                const foundActivities=await Activity.find({nft_content_hash: nft_content_hash}).populate('associated_user', '_id name').populate('associated_nft', '_id name content_hash')
                return res.status(200).json({message: 'Success', activities: foundActivities})
            }
            const foundActivities=await Activity.find({type: 'Broadcast'})
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
    public static  writeActivityEvent(res: Response, sseId: string, data: string){
        res.write(`id: ${sseId}\n`);
        res.write(`data: ${data}\n\n`);
    }
    public static async sendActivityEvent (req: Request, res: Response){
        res.writeHead(200, {
          'Cache-Control': 'no-cache',
          "Connection": 'keep-alive',
          'Content-Type': 'text/event-stream',
        });
        const sseId = new Date().toDateString();
        const findQuery: any= [{type: 'Broadcast'}]
        if(res?.locals?.userId){
            findQuery.push({associated_user: res.locals.userId})
        }
        const intervalId=setInterval(async () => {
            const foundActivities=await Activity.find({'$or': findQuery}).populate('associated_user', 'name email _id avatar').sort({createdAt: -1}).limit(5)
            // console.log('Found Activities are', foundActivities)
            const unreadActivityCount=await Activity.count({'$and': [{isRead: false}, {'$or': findQuery}]})
            // console.log('Activity Count is', unreadActivityCount)
            ActivityController.writeActivityEvent(res, sseId, JSON.stringify({foundActivities: foundActivities, unreadCount: unreadActivityCount}));
        }, SEND_INTERVAL);
        // clearInterval(intervalId)
        // ActivityController.writeActivityEvent(res, sseId, JSON.stringify(foundActivities));
    }
    public static async getAllNotifications(req: Request, res: Response){
        if (req.headers.accept === 'text/event-stream') {
            await ActivityController.sendActivityEvent(req, res);
        } else {
            res.json({ message: 'Ok' });
        }
    }
}
export default ActivityController