import mongoose from "../providers/Database"
export default interface IActivity extends mongoose.Document{
    description: string,
    type: string,
    isRead: boolean,
    receivers?: Array<Object>,
    associated_nft?: any,
    associated_user?:any,
    nft_content_hash?: string
}