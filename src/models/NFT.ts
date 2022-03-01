import mongoose from "../providers/Database";
import INFT from "../interfaces/NFT";


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
            }
        }
    ],
    wished_by:[
        {
            user_id: {
                type: String
            }
        }
    ]
}, {timestamps: true}) 



const NFT: INFTModel<INFT> = mongoose.model<INFT>('NFT', NFTSchema) as INFTModel<INFT>;

export default NFT