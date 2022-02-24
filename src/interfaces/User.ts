// Define Interface for user model
export interface IUser{
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
    banner: string
}
export default IUser