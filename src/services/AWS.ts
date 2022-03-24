import AWS from 'aws-sdk';
import Logger from '../providers/Logger';
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
    public static async sendEmail(to: string|string[], body: string, subject: string){
        try{
            if(!Array.isArray(to)){
                to=[to]
            }
            const params = {
                Destination: {
                  ToAddresses: to
                },
                Message: {
                  Body: {
                    Html: {
                     Charset: "UTF-8",
                     Data: `${body}`
                    }
                   },
                   Subject: {
                    Charset: 'UTF-8',
                    Data: `${subject}`
                   }
                  },
                Source: `${Locals.config().emailSenderAddress}`
              };
              console.log('Params are', params)
              const SESConfig={
                  apiVersion: '2010-12-01',
                  region: Locals.config().awsRegion,
                  accessKeyId:  Locals.config().awsAccessId,
                  secretAccessKey:  Locals.config().awsSecretKey,
                }
              // Create the promise and SES service object
              const sendPromise = new AWS.SES(SESConfig).sendEmail(params).promise();
              return await sendPromise.then((data)=>{
                            Logger.info(`Email Message Id id ${data.MessageId}`)
                            return {
                                success: true,
                                message: 'email has been sent'
                            }
                        }).catch((err)=>{
                            console.error(err);
                            return {
                                success: false,
                                message: 'unable to send email',
                                error: err.toString()
                            }
                        })
        }catch(err){
            console.log(err)
        }
    }
}
export default AWSService