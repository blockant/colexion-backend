import mongoose from "../providers/Database";
import INFT from "../interfaces/NFT";
import mongoosePaginate from 'mongoose-paginate-v2'


interface INFTModel<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}

const NFTSchema= new mongoose.Schema<INFT>({
    content_hash:{
        type: String,
        required: true,
        unique: true
    },
    liked_by:[
        {
            user_id: {
                type: String
            },
            _id: false
        }
    ],
    wished_by:[
        {
            user_id: {
                type: String
            },
            _id: false
        }
    ],
    onMarketPlace:{
        type: Boolean
    },
    file_url:{
        type: String
    },
    minted:{
        type: Boolean,
        default: false
    },
    tokenId:{
        type: String
    },
    category:{
        type: String,
        enum:["Celebrities","Sports","Music","Others"]
    },
    name:{
        type: String,
    },
    description:{
        type: String
    },
    file_cloud_url:{
        type: String
    },
    file_type:{
        type: String
    },
    owner_address:{
        type: String,
        default: '0x0000000000000000000000000000000000000000'
    },
    price:{
        type: String
    },
    token_address:{
        type: String
    },
    sale_type:{
        type: String,
        enum: ['BUY', 'AUCTION', 'OPEN BIDS']
    },
    auction_start_time:{
        type: Date
    },
    auction_end_time:{
        type: Date
    },
    orderId:{
        type: String
    },
    claimed:{
        type: Boolean
    },
    to_be_claimed_by_after_action:{
        type: String,
    }
}, {timestamps: true}) 


NFTSchema.plugin(mongoosePaginate)
const NFT: INFTModel<INFT> = mongoose.model<INFT>('NFT', NFTSchema) as INFTModel<INFT>;

export default NFT