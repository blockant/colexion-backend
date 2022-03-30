import mongoose from "../providers/Database"
export default interface IOwnershipHistory extends mongoose.Document{
    new_owner_address: string,
    previous_owner_address: string,
    nft_content_hash: string,
    createdAt: string,
    quantity: number
}