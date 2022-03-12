import mongoose from '../providers/Database'
import IFollows from '../interfaces/Follows'
interface IFollowsModel<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}

const FollowsSchema= new mongoose.Schema<IFollows>({
    follower:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    following:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true}) 



const Follows: IFollowsModel<IFollows> = mongoose.model<IFollows>('Follows', FollowsSchema) as IFollowsModel<IFollows>;

export default Follows