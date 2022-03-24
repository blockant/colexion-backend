import cron from 'node-cron'
import Bid from '../models/Bid'
import User from '../models/User'
import NFT from '../models/NFT'

/**
 * Check For Those NFT's whose auction has expired every minute
 * Set claim address based on the winning bid 
 */
const auctionCron=cron.schedule('* * * * *', async ()=>{
    try{
        console.log('Updating Auction Status.....')
        const foundNFTs=await NFT.find({sale_type: 'AUCTION', auction_end_time: {'$lte': new Date().toISOString()}, to_be_claimed_by_after_action: '0x0000000000000000000000000000000000000000'})
        for (const nft of foundNFTs) {
            //Find Highest Bid
            const maxBid=await Bid.find({nft: nft._id}).sort({amount: -1}).limit(1)
            nft.to_be_claimed_by_after_action=maxBid?.[0]?.wallet_address
            await nft.save()
        }
    }catch(err){
        console.log(err)
    }
})

class CronJobs{
    public static initCron(){
        auctionCron.start()
    }
}
export default CronJobs