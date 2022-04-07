import mongoose from "mongoose";
import IOTP from "../interfaces/OTP";
import bcrypt from 'bcrypt'

const OTPSchema=new mongoose.Schema<IOTP>({
    password:{type: String, required: true},
    expiry: {type: Date, required: true},
    user_email:{
        type: String,
        required: true
    }
})
// Password hash middleware
OTPSchema.pre<IOTP>('save', function (_next) {
	const otp = this;
	// Only Save If otp Is Modified
    if (!otp.isModified('password')) {
		return _next();
	}
    // Generate Salt
	bcrypt.genSalt(10, (_err, _salt) => {
		if (_err) {
			return _next(_err);
		}
		bcrypt.hash(otp.password, _salt, (_berr, _hash) => {
			if (_berr) {
				return _next(_berr);
			}
			otp.password = _hash;
			return _next();
		});
	});
});

// Defining Schema Methods
OTPSchema.methods={
    // To Authenticate A User
    verify(plainotp: string): boolean{
        const isValidPass = bcrypt.compareSync(plainotp, this.password);
          if(isValidPass){
            return true;
          }else{
            return false;
          }
    }
}
const OTPModel=mongoose.model('otp', OTPSchema)
export default OTPModel