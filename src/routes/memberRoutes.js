import express from "express";
import { createMember, exportMembersCsv, listMembers, setShaheenStatus, updateMember } from "../controllers/memberController.js";
import { requireAuth } from "../middleware/auth.js";

export const memberRouter = express.Router();

memberRouter.use(requireAuth);
memberRouter.get("/", listMembers);
memberRouter.post("/", createMember);
memberRouter.get("/export.csv", exportMembersCsv);
memberRouter.patch("/:id", updateMember);
memberRouter.patch("/:id/shaheen", setShaheenStatus);
