import mongoose from "../providers/Database";
import IUser from "../interfaces/User";
import bcrypt from 'bcrypt'

// Create the model schema & register your custom methods here
export interface IUserModel extends IUser, mongoose.Document {
    authenticate(password: string): boolean;
}

const UserSchema= new mongoose.Schema<IUserModel>(
    {
        email: {
            type:String,
            trim: true,
            unique: true,
            lowercase: true,
            match: [/^([a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/gm, 'Please fill a valid email address']
        },
        name: {type: String, required: true},
        password: {type: String, required: true},
        email_verified: {
            type: Boolean,
            default: false
        },
        wallets:[
            {
                name: String,
                address: String
            }
        ],
        external_urls:[
            {
                platform: {
                    type: String,
                    required: true
                },
                link: {
                    type: String,
                    required: true
                }
            }
        ],
        bio:{
            type: String
        },
        avatar: String,
        banner: String
    },{
        timestamps: true
    }
)

// Password hash middleware
UserSchema.pre<IUserModel>('save', function (_next) {
	const user = this;
	// Only Save If User Is Modified
    if (!user.isModified('password')) {
		return _next();
	}
    // Generate Salt
	bcrypt.genSalt(10, (_err, _salt) => {
		if (_err) {
			return _next(_err);
		}
		bcrypt.hash(user.password, _salt, (_berr, _hash) => {
			if (_berr) {
				return _next(_berr);
			}
			user.password = _hash;
			return _next();
		});
	});
});

// Defining Schema Methods
UserSchema.methods={
    // To Authenticate A User
    authenticate(plainpassword: string): boolean{
        const isValidPass = bcrypt.compareSync(plainpassword, this.password);
          if(isValidPass){
            return true;
          }else{
            return false;
          }
    }
}

const User = mongoose.model<IUserModel>('User', UserSchema);
export default User