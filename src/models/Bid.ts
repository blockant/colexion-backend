import mongoose from "../providers/Database";
import IBid from "../interfaces/Bid";
import mongoosePaginate from 'mongoose-paginate-v2'
interface IBidModel<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}
const BidSchema= new mongoose.Schema<IBid>(
    {
      amount:{
          type: Number,
          required: true
      },
      created_by:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
      },
      nft:{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'NFT',
          required: true
      },
      wallet_address:{
          type: String
      }
    },{
        timestamps: true
    }
)
BidSchema.plugin(mongoosePaginate)
const Bid: IBidModel<IBid> = mongoose.model<IBid>('Bid', BidSchema) as IBidModel<IBid>;

export default Bid
