import express from "express";
import { changePassword, login, me, setupInitialPresident } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = express.Router();

authRouter.post("/setup", setupInitialPresident);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);
authRouter.patch("/password", requireAuth, changePassword);
