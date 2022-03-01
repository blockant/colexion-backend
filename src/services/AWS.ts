import AWS from 'aws-sdk';
import Locals from '../providers/Locals';
class AWSService{
    public static async uploadToS3Bucket(file: any, bucket_name: string){
        try{
            const s3=new AWS.S3({
                accessKeyId: Locals.config().awsAccessId,
                secretAccessKey: Locals.config().awsSecretKey
            })
            const params = {
                Bucket: bucket_name,
                Key: file.originalname,
                Body: file.buffer
            };
            console.log('Params are', params)
            const data=await s3.upload(params).promise()
            return data.Location
        }catch(err){
            console.log(err)
            throw new Error('File Upload to AWS Failed')
        }
    }
}
export default AWSService