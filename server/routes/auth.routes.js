import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";


const authRouter = express.Router()

authRouter.post("/signup", registerUser)
authRouter.post("/login", loginUser)

export {authRouter}