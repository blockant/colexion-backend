import mongoose from "../providers/Database"
export default interface IFollows extends mongoose.Document{
    follower: mongoose.Schema.Types.ObjectId,
    following: mongoose.Schema.Types.ObjectId
}