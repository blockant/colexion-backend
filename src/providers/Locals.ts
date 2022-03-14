import { Application } from 'express';
import * as path from 'path';
import * as dotenv from 'dotenv';

class Locals {
	/**
	 * Makes env configs available for your app
	 * throughout the app's runtime
	 */
	public static config(): any {
		dotenv.config({ path: path.join(__dirname, '../../.env') });

		const url = process.env.APP_URL || `http://localhost:${process.env.PORT}`;
		const port = process.env.PORT || 4040;
		const mongooseUrl = process.env.MONGOOSE_URL;
		const maxUploadLimit = process.env.APP_MAX_UPLOAD_LIMIT || '50mb';
		const maxParameterLimit = process.env.APP_MAX_PARAMETER_LIMIT || '50mb';
		const name = process.env.APP_NAME || 'NFT Marketplace';
		const year = (new Date()).getFullYear();
		const copyright = `Copyright ${year} ${name} | All Rights Reserved`;
		const description = process.env.APP_DESCRIPTION || 'Here goes the app description';
		const isCORSEnabled = process.env.CORS_ENABLED || true;
		const jwtExpiresIn = process.env.JWT_EXPIRES_IN || 3;
		const apiPrefix = process.env.API_PREFIX || 'api';
		const logDays = process.env.LOG_DAYS || 20;
        const jwtSecretKey= process.env.JWT_SECRET_TOKEN_KEY
		const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
		const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
		const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
		const twilioTestNumber = process.env.MY_NUMBER;
		const awsRegion=process.env.AWS_REGION;
        const facebookAppId=process.env.FACEBOOK_CLIENT_API
        const facebookAppSecret=process.env.FACEBOOK_CLIENT_SECRET
        const frontend_url=process.env.frontend_url
		const gcpBucketName=process.env.GCP_BUCKET_NAME
		const awsAccessId=process.env.AWS_ACCESS_KEY_ID
		const awsSecretKey=process.env.AWS_SECRET_ACCESS_KEY
		const awsS3Bucket=process.env.AWS_S3_BUCKET_NAME
		const pinataAPIKey=process.env.PINATA_API_KEY
		const pinataSecret=process.env.PINATA_API_SECRET
		const ERC721Address=process.env.ERC721Address
		return {
			apiPrefix,
			copyright,
			description,
			isCORSEnabled,
			jwtExpiresIn,
			logDays,
			maxUploadLimit,
			maxParameterLimit,
			mongooseUrl,
			name,
			port,
			url,
            jwtSecretKey,
			twilioAccountSid,
			twilioAuthToken,
			twilioNumber,
			twilioTestNumber,
			awsAccessId,
			awsRegion,
			awsSecretKey,
            facebookAppId,
            facebookAppSecret,
            frontend_url,
			gcpBucketName,
			awsS3Bucket,
			pinataAPIKey,
			pinataSecret,
			ERC721Address
		};
	}
}

export default Locals;