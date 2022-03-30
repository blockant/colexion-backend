import mongoose from '../providers/Database'
import IActivity from '../interfaces/Activity'
interface IActivityModel<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}

const ActivitySchema= new mongoose.Schema<IActivity>({
    description: {
        type: String,
        required: true
    },
    type:{
        type: String,
        enum: ['Broadcast', 'User', 'Group'],
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    receivers:{
        type: [Object]
    },
    associated_nft:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NFT'
    },
    associated_user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    nft_content_hash:{
        type: String
    }
}, {timestamps: true}) 



const Activity: IActivityModel<IActivity> = mongoose.model<IActivity>('Activity', ActivitySchema) as IActivityModel<IActivity>;

export default Activity