import mongoose from "../providers/Database"
export default interface IActivity extends mongoose.Document{
    description: string,
    type: string,
    isRead: boolean,
    receivers?: Array<Object> 
}