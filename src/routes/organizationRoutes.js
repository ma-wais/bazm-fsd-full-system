import express from "express";
import {
  createPostAssignment,
  createUnit,
  createZone,
  listPostAssignments,
  listUnits,
  listZones,
  overview,
  updateUnit,
  updateZone
} from "../controllers/organizationController.js";
import { requireAuth } from "../middleware/auth.js";

export const organizationRouter = express.Router();

organizationRouter.use(requireAuth);
organizationRouter.get("/overview", overview);
organizationRouter.get("/zones", listZones);
organizationRouter.post("/zones", createZone);
organizationRouter.patch("/zones/:id", updateZone);
organizationRouter.get("/units", listUnits);
organizationRouter.post("/units", createUnit);
organizationRouter.patch("/units/:id", updateUnit);
organizationRouter.get("/posts", listPostAssignments);
organizationRouter.post("/posts", createPostAssignment);
