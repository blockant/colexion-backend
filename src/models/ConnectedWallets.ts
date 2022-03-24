import mongoose from "../providers/Database";
import IConnectedWallets from "../interfaces/ConnectedWallets";
import mongoosePaginate from 'mongoose-paginate-v2'
interface IConnectedWalletsModel<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}
const ConnectedWalletSchema= new mongoose.Schema<IConnectedWallets>({
    wallet_address: {
        type: String,
        required: true,
        unique: true
    },
    connected_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true})
ConnectedWalletSchema.plugin(mongoosePaginate)
const ConnectedWallets: IConnectedWalletsModel<IConnectedWallets> = mongoose.model<IConnectedWallets>('ConnectedWallets', ConnectedWalletSchema) as IConnectedWalletsModel<IConnectedWallets>;

export default ConnectedWallets
