import util from 'util'
import Multer from 'multer'
const upload = Multer({
  storage: Multer.memoryStorage()
})
export default upload