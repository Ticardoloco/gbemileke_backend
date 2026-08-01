import User, { UserGender, UserRole } from "../models/userModel.js";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary"; 
import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const getJwtSecret = (): string => {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined in the environment.");
  }
  return secret;
};

// Helper to project the complete user object consistently across endpoints
const sanitizeUser = (user: any) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber || "",
  gender: user.gender || null,
  role: user.role,
  avatar: user.avatar || "",
  address: user.address || {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Nigeria",
  },
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export async function registerUser(req: Request, res: Response) {
  try {
    const { fullName, email, password, gender } = req.body as {
      fullName: string;
      email: string;
      password: string;
      gender?: string;
    };

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
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
      user: sanitizeUser(user),
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

    // FIX: Send full user payload (including address, avatar, phoneNumber) on login
    return res.status(200).json({
      message: "User logged in successfully",
      token,
      user: sanitizeUser(user),
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

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}

export async function getUserProfile(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  return res.json({ user: sanitizeUser(req.user) });
}

export async function getUserProfiles(req: Request, res: Response) {
  try {
    const users = await User.find().select("-passwordHash");
    return res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users.map(sanitizeUser),
    });
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

    const { fullName, phoneNumber, gender, address, avatar } = req.body as {
      fullName?: string;
      phoneNumber?: string;
      gender?: string;
      address?: any;
      avatar?: string;
    };

    const updateData: Record<string, any> = {};

    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

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

    // 1A. File Upload via Multer Buffer
    if (req.file) {
      try {
        const avatarUrl = await uploadToCloudinary(req.file.buffer, "gbemileke_hospital/avatars");
        updateData.avatar = avatarUrl;
      } catch (uploadError) {
        console.error("🚨 CLOUDINARY ENGINE CRASHED:", uploadError);
        return res.status(500).json({ 
          message: "Failed to upload avatar to cloud", 
          debugDetails: uploadError instanceof Error ? uploadError.message : uploadError 
        });
      }
    } 
    // 1B. Base64 Upload directly via JSON body payload
    else if (avatar && avatar.startsWith("data:image")) {
      try {
        cloudinary.config({
          cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
          api_key: process.env["CLOUDINARY_API_KEY"],
          api_secret: process.env["CLOUDINARY_API_SECRET"],
        });

        const uploadRes = await cloudinary.uploader.upload(avatar, {
          folder: "gbemileke_hospital/avatars",
        });
        updateData.avatar = uploadRes.secure_url;
      } catch (uploadError) {
        console.error("🚨 BASE64 CLOUDINARY UPLOAD FAILED:", uploadError);
        return res.status(500).json({ message: "Failed to upload avatar image" });
      }
    } else if (avatar) {
      updateData.avatar = avatar;
    }

    // 2. Parse address payload (handles JSON string or nested Object)
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
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: UserRole | string };

    const validRoles = ["patient", "practitioner", "admin"];

    if (!role || !validRoles.includes(role.toLowerCase().trim())) {
      return res.status(400).json({
        message: `Invalid role. Allowed values: ${validRoles.join(", ")}`,
      });
    }

    const normalizedRole = role.toLowerCase().trim() as UserRole;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role: normalizedRole } },
      { returnDocument: "after", runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: `User role updated to '${normalizedRole}' successfully.`,
      user: sanitizeUser(updatedUser),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update user role.",
      error: error.message || error,
    });
  }
}

export async function deleteUserProfile(req: Request, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    if (user.avatar && user.avatar.includes("cloudinary.com")) {
      try {
        const urlParts = user.avatar.split("/");
        const folderAndFileName = urlParts.slice(-2).join("/");
        const publicId = folderAndFileName.split(".")[0];
        
        cloudinary.config({
          cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
          api_key: process.env["CLOUDINARY_API_KEY"],
          api_secret: process.env["CLOUDINARY_API_SECRET"],
        });

        await cloudinary.uploader.destroy(publicId);
      } catch (cloudDeleteError) {
        console.error("⚠️ Failed to purge old avatar from cloud storage during deletion:", cloudDeleteError);
      }
    }

    await User.findByIdAndDelete(userId);

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
  updateUserRole,
  deleteUserProfile
};