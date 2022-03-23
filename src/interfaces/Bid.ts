import mongoose from "../providers/Database"
export default interface IBid extends mongoose.Document{
    amount: Number,
    nft: mongoose.Schema.Types.ObjectId,
    created_by:mongoose.Schema.Types.ObjectId,
    wallet_address: string
}