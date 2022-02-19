// You can set up mongoDb connection pool here
import mongoose from 'mongoose'
import Locals from './Locals'
import Logger from './Logger'
import mongoosePaginate from 'mongoose-paginate-v2';
export class Database{
    public static init():any{
        // const options = {
        //     /*Always add a radix after number in parseInt it will tell TS wether given number should be in decimal, binary , octa etc*/
        //     poolSize: parseInt(process.env.POOL_SIZE!, 10),
        // };
        Logger.info(`Mongoose url is ${Locals.config().mongooseUrl}`)
        mongoose.connect(Locals.config().mongooseUrl!)
            .then((_) => {
              Logger.info('Connected to Distribution API Database - Initial Connection');
            })
            .catch((err) => {
              Logger.error(err)
              Logger.error(`Initial Distribution API Database connection error occured - ${err.message}`);
            });
        mongoose.set("debug",true);
        mongoose.plugin(mongoosePaginate)
    }
}
export default mongoose