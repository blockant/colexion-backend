import mongoose from "../providers/Database"
export default interface IOwnershipHistory extends mongoose.Document{
    new_owner_address: string,
    previous_owner_address: string,
    nft: mongoose.Schema.Types.ObjectId,
    createdAt: string
}