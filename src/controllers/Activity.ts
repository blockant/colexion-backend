import Activity from "../models/Activity"
import { Request, Response } from "express";
import ErrorHandler from "../providers/Error";
import NFT from "../models/NFT";
import ConnectedWallets from "../models/ConnectedWallets";
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
                const foundActivities=await Activity.find({nft_content_hash: nft_content_hash, type: 'Broadcast'}).populate('associated_user', '_id name avatar').populate('associated_nft', '_id name content_hash')
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
        if(req?.query?.userId){
            findQuery.push({associated_user: req.query.userId})
            findQuery.push({type: 'Group', receivers: {'$in': [req.query.userId]}})
        }
        console.log('FindQuery is', findQuery)
        const intervalId=setInterval(async () => {
            const foundActivities=await Activity.find({'$or': findQuery}).populate('associated_user', 'name email _id avatar').sort({createdAt: -1}).limit(5)
            console.log('Found Activities are', foundActivities)
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
    public static async createActivityForGroups(description: string, associated_user: string, nft_id: string){
        //Send New Activity for bid
        try{
            const foundActivities=await Activity.find({associated_nft: nft_id, type: 'Group'})
            const foundNFT=await NFT.findById(nft_id).lean()
            if(!foundNFT){
                throw new Error('Can not find NFT')
            }
            const foundWallet=await ConnectedWallets.findOne({wallet_address: foundNFT.owner_address})
            if(!foundWallet){
                throw new Error('No user on platform connected to this wallet')
            }
            console.log(foundWallet)
            const nft_creator: string=foundWallet.connected_user.toString()
            //Get Existing Receivers (NFT Creator Must always be receiver)
            const foundReceivers: Record<string, boolean>={}
            if(nft_creator){
                foundReceivers[`${nft_creator}`]=true
            }   
            
            for (const activity of foundActivities) {
                foundReceivers[`${activity.associated_user}`]=true
            }
            //Add Current user to receiver as well
            foundReceivers[`${associated_user}`]=true
            const receivers=Object.keys(foundReceivers)
            //Update Receivers of previous activities
            await Activity.updateOne({associated_nft: nft_id, type: 'Group'}, {'$set': {'receivers': receivers}})
            //Messages will be different in case of ERC1155 and ERC721
            await Activity.create({associated_nft: nft_id, type: 'Group', receivers: receivers, associated_user: associated_user, description: description})
        }catch(err){
            console.log('Error creating activity', err)
        }
        
    }
}
export default ActivityController