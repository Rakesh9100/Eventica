import express from 'express'
import { deleteProfile, editProfile, getProfile } from '../controllers/profile.controller.js'


const profileRouter  = express.Router()


profileRouter.get('/getprofile',getProfile)
profileRouter.post('/editprofile', editProfile)
profileRouter.delete('/deleteProfile', deleteProfile)


export {profileRouter}