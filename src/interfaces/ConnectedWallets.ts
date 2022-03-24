import mongoose from "../providers/Database"
export default interface IConnectedWallets extends mongoose.Document{
    wallet_address: string,
    connected_user: mongoose.Schema.Types.ObjectId
}