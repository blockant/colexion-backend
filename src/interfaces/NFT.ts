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
    onMarketPlace:boolean,
    file_url:{
        type: string
    },
    liked_by_logged_in_user: boolean,
    wished_by_logged_in_user: boolean,
    minted: boolean,
    tokenId: string,
    category:string,
    name:string,
    description: string,
    file_cloud_url: string,
    file_type: string,
    owner_address: string,
    price: string,
    token_address: string,
    sale_type: string,
    auction_start_time: Date,
    auction_end_time: Date,
    orderId: string,
    claimed: boolean,
    to_be_claimed_by_after_action: string,
    createdAt: string,
    updatedAt: string,
    created_by: any,
    owned_by_logged_in_user: boolean,
    views: number,
    quantity: number,
    contract_type: string,
    deployed_network: string,
    current_max_bid: string
}