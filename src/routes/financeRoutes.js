import express from "express";
import { createFinanceRecord, exportFinanceCsv, financeSummary, listFinanceRecords } from "../controllers/financeController.js";
import { requireAuth } from "../middleware/auth.js";

export const financeRouter = express.Router();

financeRouter.use(requireAuth);
financeRouter.get("/", listFinanceRecords);
financeRouter.post("/", createFinanceRecord);
financeRouter.get("/summary", financeSummary);
financeRouter.get("/export.csv", exportFinanceCsv);
