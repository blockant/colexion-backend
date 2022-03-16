import AWS from 'aws-sdk'
import Locals from '../providers/Locals'
AWS.config.update(
    {
        accessKeyId:  Locals.config().awsAccessId,
        secretAccessKey:  Locals.config().awsSecretKey,
    }
)
export default AWS