import User, { UserGender } from "../models/userModel.js";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary"; 
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // ✅ FIX: Added .js extension helper


// Helper to safely fetch and verify the JWT Secret
const getJwtSecret = (): string => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error(
      "FATAL ERROR: JWT_SECRET is not defined in the environment.",
    );
  }
  return secret;
};

export async function registerUser(req: Request, res: Response) {
  try {
    const { fullName, email, password, gender } = req.body as {
      fullName: string;
      email: string;
      password: string;
      gender?: string;
    };

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All field are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let userGender: UserGender | undefined;
    if (gender) {
      const normalizedGender = gender.toLowerCase().trim() as UserGender;
      if (["male", "female", "other"].includes(normalizedGender)) {
        userGender = normalizedGender;
      }
    }

    const user = await User.create({
      fullName,
      email,
      passwordHash,
      ...(userGender && { gender: userGender }),
    });

    const token = jwt.sign({ userId: String(user._id) }, getJwtSecret(), {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: String(user._id),
        fullName,
        email,
        gender: user.gender || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: String(user._id), fullName: user.fullName, email: user.email },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        id: String(user._id),
        fullName: user.fullName,
        email: user.email,
        gender: user.gender || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}

export async function logoutUser(req: Request, res: Response) {
  try {
    const { email } = req.body as { email: string };
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User logged out successflly" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}

export async function getUserProfile(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  return res.json(req.user);
}

export async function getUserProfiles(req:Request, res:Response) {
    try {
        const users = await User.find().select("-passwordHash");
        return res.status(200).json({message: "Users Retreived successfully", count: users.length, users})
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}


export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { fullName, phoneNumber, gender, address } = req.body as {
      fullName?: string;
      phoneNumber?: string;
      gender?: string;
      address?: string; 
    };

    const updateData: Record<string, any> = {};

    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    // Validate gender against allowed enum values
    if (gender) {
      const normalizedGender = gender.toLowerCase().trim() as UserGender;
      if (["male", "female", "other"].includes(normalizedGender)) {
        updateData["gender"] = normalizedGender;
      } else {
        return res.status(400).json({
          message: "Invalid gender value. Must be 'male', 'female', or 'other'.",
        });
      }
    }

    // 1. Image buffer upload handoff
    if (req.file) {
      try {
        // Keeps your assets segregated in a clean subfolder away from your DMG application inventory
        const avatarUrl = await uploadToCloudinary(req.file.buffer, "gbemileke_hospital/avatars");
        updateData.avatar = avatarUrl;
      } catch (uploadError) {
        // ✅ FIX: Enhanced troubleshooting visibility for environment variable issues
        console.error("🚨 CLOUDINARY ENGINE CRASHED:", uploadError);
        return res.status(500).json({ 
          message: "Failed to upload avatar to cloud", 
          debugDetails: uploadError instanceof Error ? uploadError.message : uploadError 
        });
      }
    }

    // 2. Safely parse and update address fields
    if (address) {
      try {
        const parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
        
        if (parsedAddress.street !== undefined) updateData["address.street"] = parsedAddress.street;
        if (parsedAddress.city !== undefined) updateData["address.city"] = parsedAddress.city;
        if (parsedAddress.state !== undefined) updateData["address.state"] = parsedAddress.state;
        if (parsedAddress.zipCode !== undefined) updateData["address.zipCode"] = parsedAddress.zipCode;
        if (parsedAddress.country !== undefined) updateData["address.country"] = parsedAddress.country;
      } catch (e) {
        return res.status(400).json({ message: "Invalid address format. Must be valid JSON." });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}


export async function deleteUserProfile(req: Request, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // 1. Fetch the user profile first so we can check for cloud assets before wiping the record
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    // 2. If they have a custom avatar uploaded to Cloudinary, clean it up!
    if (user.avatar && user.avatar.includes("cloudinary.com")) {
      try {
        // Extract the public ID from the URL (e.g., gbemileke_hospital/avatars/image_name)
        const urlParts = user.avatar.split("/");
        const folderAndFileName = urlParts.slice(-2).join("/"); // gets "folder/filename"
        const publicId = folderAndFileName.split(".")[0]; // removes the extension like .png
        
        // Initialize config block dynamically to ensure env variable injection safety
        cloudinary.config({
          cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
          api_key: process.env["CLOUDINARY_API_KEY"],
          api_secret: process.env["CLOUDINARY_API_SECRET"],
        });

        await cloudinary.uploader.destroy(publicId);
      } catch (cloudDeleteError) {
        // Log the error but don't halt user deletion if cloud asset cleanup slips up
        console.error("⚠️ Failed to purge old avatar from cloud storage during deletion:", cloudDeleteError);
      }
    }

    // 3. Complete the database removal execution
    await User.findByIdAndDelete(userId);

    // 4. Send clear instructions back to the frontend to purge localStorage/Cookies tokens
    return res.status(200).json({
      message: "Your profile and associated storage assets have been successfully deleted.",
      actionRequired: "CLEAR_LOCAL_AUTH_TOKENS" 
    });

  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}

export default {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    getUserProfiles,
    updateUserProfile,
    deleteUserProfile
}