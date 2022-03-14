import pinataSDK from '@pinata/sdk'
import Locals from '../providers/Locals'
const pinata=pinataSDK(Locals.config().pinataAPIKey, Locals.config().pinataSecret)
export default pinata