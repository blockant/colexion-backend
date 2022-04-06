import mongoose from "../providers/Database";
import ICelebrity from "../interfaces/Celebrity";
import mongoosePaginate from 'mongoose-paginate-v2'


interface ICelebrityModel<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}

const CelebritySchema= new mongoose.Schema<ICelebrity>({
   name:{
       type: String,
       required: true
   },
   tier:{
       type: String,
       required: true
   },
   category:{
       type: String
   },
   email: {
        type:String,
        trim: true,
        unique: true,
        lowercase: true,
        match: [/^([a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/gm, 'Please fill a valid email address']
    },
    onboarded:{
        type: Boolean,
        default: false
    }
}, {timestamps: true}) 


CelebritySchema.plugin(mongoosePaginate)
const Celebrity: ICelebrityModel<ICelebrity> = mongoose.model<ICelebrity>('Celebrity', CelebritySchema) as ICelebrityModel<ICelebrity>;

export default Celebrity