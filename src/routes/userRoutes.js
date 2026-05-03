import express from "express";
import { createUser, getRoleOptions, listUsers, updateOwnProfile, updateUserStatus } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

export const userRouter = express.Router();

userRouter.use(requireAuth);
userRouter.get("/", listUsers);
userRouter.post("/", createUser);
userRouter.get("/roles", getRoleOptions);
userRouter.patch("/me", updateOwnProfile);
userRouter.patch("/:id/status", updateUserStatus);
