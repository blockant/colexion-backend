import processFileMiddleware from "../middlewares/Upload";
import { Storage } from "@google-cloud/storage";
import Locals from "../providers/Locals";
import { format } from "util";
import Events from "./Events";
const storage = new Storage({ keyFilename: "google-cloud-key.json" });
class GoogleCloud{
    public static async uploadFileToBucket(file: any, bucket_name: string, source: string){
        try{
            console.log('Bucket Name is, file is', bucket_name, file)
            const bucket = storage.bucket(bucket_name);
            const blob = bucket.file(file.originalname);
            const blobStream = blob.createWriteStream();
            blobStream.on("error", (err) => {
              throw new Error(err.message)
            });
            let publicUrl=''
            blobStream.on("finish", async () => {
              // Create URL for directly file access via HTTP.
              publicUrl = format(
                `https://storage.googleapis.com/${bucket.name}/${blob.name}`
              );
              if(source==='nft-upload'){
                Events.nftEvent.emit('nft-s3-upload-success', publicUrl)
              }
            })
            blobStream.end(file.buffer);
        }catch(err){
            console.log(err)
            throw new Error('File Upload to Google Cloud Failed')
        }
    }
}
export default GoogleCloud