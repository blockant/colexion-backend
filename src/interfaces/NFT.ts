import mongoose from "../providers/Database"
export default interface INFT extends mongoose.Document{
    content_hash: string,
    liked_by:[
        {
            user_id: string
        }
    ],
    wished_by:[
        {
            user_id: string
        }
    ],
    onMarketPlace:{
        type: boolean
    },
    file_url:{
        type: string
    },
    liked_by_logged_in_user: boolean,
    wished_by_logged_in_user: boolean,
    minted: boolean,
    tokenId: {
        type: string
    },
}