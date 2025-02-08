import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()


const secretKey = process.env.SECRET_KEY

if (!secretKey) {
    console.log("No secretKey defined check env path")
    process.exit()
}


// Get user profile function
const getProfile = async (req, res) => {
    try {
      console.log("getProfile called");

      // Step 1: Get the token from the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        // If the header is missing, return an error
        console.error("Authorization header is missing.");
        return res.status(401).send({ error: "No token provided." });
      }
  
      // Step 2: Extract the token from the Authorization header
      const token = authHeader.split(' ')[1];
      if (!token) {
        // If the token is missing, return an error
        console.error("Bearer token is missing.");
        return res.status(401).send({ error: "Invalid token format." });
      }
  
      // Step 3: Verify the token
      const decoded = jwt.verify(token, secretKey);
      
      // Step 4: Retrieve user information based on the decoded token's ID
      const user = await User.findById(decoded.id);
      if (!user) {
        // If no user is found, return an error
        console.error(`User not found for token with userId: ${decoded.userId}.`);
        return res.status(404).send({ error: "User not found." });
      }
  
      // Step 5: Send back detailed user profile data
      return res.status(200).send({message:"fetched successfully", fetchedUser: user})
  
      console.log(`Profile fetched successfully for user ${user.username}.`);
    } catch (error) {
      console.error("Error during profile retrieval:", error);
      if (error.name === "JsonWebTokenError") {
        // Handle invalid JWT errors
        return res.status(401).send({ error: "Invalid token." });
      }
      // Handle unexpected errors
      res.status(500).send({ error: "An error occurred while fetching the profile." });
    }
};


//eedit profile 
const editProfile = async (req,res) => {
    try {
        console.log("editProfile called");
    
        // Step 1: Get the token from the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          // If the header is missing, return an error
          console.error("Authorization header is missing.");
          return res.status(401).json({ error: "No token provided." });
        }
    
        // Step 2: Extract the token from the Authorization header
        const token = authHeader.split(' ')[1];
        if (!token) {
          // If the token is missing, return an error
          console.error("Bearer token is missing.");
          return res.status(401).json({ error: "Invalid token format." });
        }
    
        // Step 3: Verify the token
        const decoded = jwt.verify(token, secretKey);
    
        // Step 4: Find the user by ID from the decoded token
        const user = await User.findById(decoded.id);
        if (!user) {
          // If no user is found, return an error
          console.error(`User not found for token with userId: ${decoded.id}.`);
          return res.status(404).json({ error: "User not found." });
        }
    
        // Step 5: Update the user's profile fields if provided in the request body
        const { username, password, email, dob, location } = req.body;    
        if (username) user.username = username;
        if (password) user.password = password; // Ensure to hash the password if implementing
        if (email) user.email = email;
        if (dob) user.dob = dob;
        if (location) user.location = location;
    
        // Step 6: Save the updated user information
        await user.save();
    
        console.log(`Profile updated successfully for user ${user.username}.`);
        res.json({ message: "Profile updated successfully.", user });
      } catch (error) {
        console.error("Error during profile update:", error);
        if (error.name === "JsonWebTokenError") {
          // Handle invalid JWT errors
          return res.status(401).json({ error: "Invalid token." });
        }
        // Handle unexpected errors
        res.status(500).json({ error: "An error occurred while updating the profile." });
      }    
}


// Delete user profile function
const deleteProfile = async (req, res) => {
    try {
      // Step 1: Get the token from the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        // If the header is missing, return an error
        return res.status(401).json({ error: "No token provided." });
      }
  
      // Step 2: Extract the token from the Authorization header
      const token = authHeader.split(' ')[1];
      // Step 3: Verify the token
      const decoded = jwt.verify(token, secretKey);
  
      // Step 4: Find the user by ID from the decoded token
      const user = await User.findById(decoded.id);
      if (!user) {
        // If no user is found, return an error
        return res.status(404).json({ error: "User not found." });
      }
  
      // Step 5: Delete the user profile
      await user.deleteOne();
      res.json({ message: "Profile deleted successfully." });
    } catch (error) {
      // Handle unexpected errors
      res.status(500).json({ error: "An error occurred while deleting the profile." });
    }
};



export {
    getProfile,
    editProfile,
    deleteProfile
}