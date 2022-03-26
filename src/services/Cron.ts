import cron from 'node-cron'
import Bid from '../models/Bid'
import User from '../models/User'
import NFT from '../models/NFT'

/**
 * Check For Those NFT's whose auction has expired every minute
 * Set claim address based on the winning bid 
 */
const auctionCron=cron.schedule('30 * * * * *', async ()=>{
    try{
        console.log('Updating Auction Status.....')
        const currentDate=new Date().toISOString()
        console.log('Current Date is', currentDate)
        const foundNFTs=await NFT.find({sale_type: 'AUCTION', auction_end_time: {'$lte': currentDate}, to_be_claimed_by: '0x0000000000000000000000000000000000000000'})
        for (const nft of foundNFTs) {
            //Find Highest Bid
            const maxBid=await Bid.find({nft: nft._id}).sort({amount: -1}).limit(1)
            nft.to_be_claimed_by=maxBid?.[0]?.wallet_address
            nft.onMarketPlace=false
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