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
    }
}