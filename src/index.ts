import express from "express";
import cors from 'cors'
import dotenv from "dotenv"
import Logger from './providers/Logger'
import morganMiddleware from './middlewares/Morgan'
import {Database} from './providers/Database'
// Importing Routes
import masterRoutes from './routes/index'
dotenv.config()
const app = express();

Database.init()
// Configure Express to use EJS
app.use(express.json({limit: '3mb'}));
app.use(express.urlencoded({ limit: '3mb', extended: true }));
app.use(morganMiddleware)
app.use(cors())
app.get( "/health", ( req, res ) => {
    return res.status(200).json({message: "Service Running"})
});

app.use('/api/v1', masterRoutes)
app.listen( process.env.PORT, () => {
    Logger.info(`server started at http://localhost:${ process.env.PORT }`)
} );