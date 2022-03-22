import mongoose from "../providers/Database"
export default interface ICelebrities extends mongoose.Document{
    name: string,
    tier: string,
    category: string,
    email: string
}