import express from "express"
import cors from 'cors'
import bodyParser from "body-parser"


const app = express()


app.use(cors())
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//import roouter
import { authRouter } from "../routes/auth.routes.js"


//use router
app.use("/api/v1/auth", authRouter)
export {app}