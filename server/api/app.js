import express from "express"
import cors from 'cors'
import bodyParser from "body-parser"


const app = express()


app.get('/', async (req,res) => {
    res.status(200).send("express and mongodb, eventica server")
})

app.use(cors({
    origin: ['https://eventica.netlify.app', 'http://localhost:3000', 'https://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}))
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

//import roouter
import { authRouter } from "../routes/auth.routes.js"
import { profileRouter } from "../routes/profile.routes.js"
import { eventRouter } from "../routes/event.routes.js"

//use router
app.use("/api/v1/auth", authRouter)
app.use('/api/v1/profile', profileRouter)
app.use('/api/v1/event', eventRouter)
export {app}