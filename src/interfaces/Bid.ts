import mongoose from "../providers/Database"
export default interface IBid extends mongoose.Document{
    amount: Number,
    nft: mongoose.Schema.Types.ObjectId,
    created_by:any,
    wallet_address: string,
    createdAt: string,
    updatedAt: string,
    can_withdraw: boolean,
    quantity: number,
    invalid: boolean,
    accepted?:boolean
}