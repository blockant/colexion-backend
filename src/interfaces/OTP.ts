import mongoose from "../providers/Database"
export default interface IOTP extends mongoose.Document{
    password:string,
    expiry: Date,
    user_email: string,
    verify(password: string): boolean,
}