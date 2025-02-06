import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()


const secretKey = process.env.SECRET_KEY

if (!secretKey) {
    console.log("No secretKey defined check env path")
    process.exit()
}

const registerUser = async (req, res) => {
    const { username, email, password, isOrganiser } = req.body

    if (!username || !email || !password) {
        return res.status(400).send({ error: "username , email, password are required fields" })
    }

    try {
        const fetchUser = await User.findOne({ email: email })

        if (fetchUser) {
            return res.status(400).send({ message: 'User already exists' });
        }

        const newUser = new User({
            email: email,
            username: username,
            password: password
        })

        if (isOrganiser) newUser.isOrganiser = true;

        await newUser.save()
        console.log('user saved successfully')


        const token = jwt.sign({ id: newUser._id }, secretKey, {
            expiresIn: '1h',
        })

        // Respond with success message and token
        res.status(201).send({
            message: 'User created successfully',
            token,
            createdUser:newUser
        });


    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).send({ message: 'Server error', error: error.message });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User does not exist");
            return res.status(400).send({ message: 'Invalid credentials user' });
        }

        const isPasswordMatch = await user.matchPassword(password);

        if (!isPasswordMatch) {
            console.log("Password doesn't match");
            return res.status(400).send({ message: 'Invalid credentials password' });
        }

        const token = jwt.sign({ id: user._id }, secretKey, {
            expiresIn: '1h',
        });

        res.status(201).send({
            message: 'Login successful',
            token,
            LoggedInUser: user
        });
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).send({ message: 'Server error', error: error.message });
    }
}

export { registerUser,loginUser }