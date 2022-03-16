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
    }
}, {timestamps: true}) 


NFTSchema.plugin(mongoosePaginate)
const NFT: INFTModel<INFT> = mongoose.model<INFT>('NFT', NFTSchema) as INFTModel<INFT>;

export default NFT