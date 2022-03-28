import crypto from 'crypto'
import Locals from './Locals';
export default class Encrypter{
    // Encrypt The String
    public static async encryptString(text: string) {
        try{
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(Locals.config().encryptionAlgorithm,Locals.config().encryptionSecretKey, iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            //console.log('Encrypted String is', encrypted)
            const encryptedString = Buffer.from(iv.toString('hex') + ':' + encrypted.toString('hex')).toString('base64')
            return encryptedString.toString()
        }catch(err){
            console.log(err)
            if(err instanceof Error){
                throw new Error(err.message)
            }
        }
    }
    //Decrypt The String
    public static async decryptString(text: string) {
        try{
            const decryptedString = Buffer.from(text, 'base64').toString('ascii')
            const textParts: any = decryptedString.split(':');
            if(!textParts){
                throw new Error('Tampered String')
            }
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv(Locals.config().encryptionAlgorithm,Locals.config().encryptionSecretKey, iv);
            let decrypted = decipher.update(encryptedText);

            decrypted = Buffer.concat([decrypted, decipher.final()]);
            //console.log('Decrypted String is', decrypted)
            return decrypted.toString();
        }catch(err){
            console.log(err)
            if(err instanceof Error){
                throw new Error(err.message)
            }
        }
    }
}