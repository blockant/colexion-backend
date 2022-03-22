import mongoose from "../providers/Database"
// Define Interface for user model
export interface IUser extends mongoose.Document{
    email: string,
    password: string,
    name: string,
    bio: string,
    external_urls:[
        {
            platform: string,
            link: string
        }
    ],
    email_verified: boolean,
    wallets:[{
        name: string,
        address: string
    }],
    avatar: string,
    banner: string,
    authenticate(password: string): boolean,
    role: string
}
export default IUser