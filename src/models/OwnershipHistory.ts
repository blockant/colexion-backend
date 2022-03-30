import mongoose from "../providers/Database";
import IOwnershipHistory from "../interfaces/OwnershipHistory";
import mongoosePaginate from 'mongoose-paginate-v2'
interface IOwnershipHistoryModel<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}
const OwnershipHistorychema= new mongoose.Schema<IOwnershipHistory>({
    previous_owner_address:{
        type: String,
        required: true
    },
    new_owner_address:{
        type: String,
        required: true
    },
    nft_content_hash:{
        type: String,
        required: true
    },
    quantity:{
        type: Number,
        default: 1
    }
}, {timestamps: true})
OwnershipHistorychema.plugin(mongoosePaginate)
const OwnershipHistory: IOwnershipHistoryModel<IOwnershipHistory> = mongoose.model<IOwnershipHistory>('OwnershipHistory', OwnershipHistorychema) as IOwnershipHistoryModel<IOwnershipHistory>;

export default OwnershipHistory
