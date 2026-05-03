import { FinanceRecord } from "../models/FinanceRecord.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCsv } from "../utils/csv.js";
import { getRoleLevel } from "../utils/roles.js";
import { assertCanAccess, assertCanWriteFinance, resolveScope } from "../utils/scope.js";

function financeQueryForUser(user) {
  const level = getRoleLevel(user.role);
  if (level === "city") return {};
  if (level === "zone") return { zone: user.zone?._id || user.zone };
  if (level === "unit") return { unit: user.unit?._id || user.unit };
  return { _id: null };
}

function applyFinanceFilters(base, query) {
  const filter = { ...base };
  if (query.scopeType) filter.scopeType = query.scopeType;
  if (query.zone) filter.zone = query.zone;
  if (query.unit) filter.unit = query.unit;
  if (query.direction) filter.direction = query.direction;
  if (query.category) filter.category = query.category;
  if (query.from || query.to) {
    filter.occurredAt = {};
    if (query.from) filter.occurredAt.$gte = new Date(query.from);
    if (query.to) filter.occurredAt.$lte = new Date(query.to);
  }
  return filter;
}

export const listFinanceRecords = asyncHandler(async (req, res) => {
  const filter = applyFinanceFilters(financeQueryForUser(req.user), req.query);
  const limit = Math.min(Number(req.query.limit) || 100, 250);

  const records = await FinanceRecord.find(filter)
    .populate("zone", "name code")
    .populate("unit", "name code")
    .populate("recordedBy", "name email role")
    .sort({ occurredAt: -1, createdAt: -1 })
    .limit(limit);

  res.json({ records });
});

export const createFinanceRecord = asyncHandler(async (req, res) => {
  const { scopeType, zone, unit, direction, amount, category, description, paymentMethod, reference, occurredAt } = req.body;

  if (!scopeType || !direction || amount === undefined || !category || !description) {
    return res.status(400).json({ message: "Scope, direction, amount, category, and description are required." });
  }

  const scope = await resolveScope({ scopeType, zone, unit });
  assertCanWriteFinance(req.user, scope);

  const record = await FinanceRecord.create({
    scopeType: scope.scopeType,
    zone: scope.zone,
    unit: scope.unit,
    direction,
    amount,
    category,
    description,
    paymentMethod,
    reference,
    occurredAt,
    recordedBy: req.user._id
  });

  await record.populate("zone", "name code");
  await record.populate("unit", "name code");
  await record.populate("recordedBy", "name email role");

  res.status(201).json({ record });
});

export const financeSummary = asyncHandler(async (req, res) => {
  const filter = applyFinanceFilters(financeQueryForUser(req.user), req.query);
  const totals = await FinanceRecord.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          direction: "$direction",
          scopeType: "$scopeType"
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    income: 0,
    expense: 0,
    balance: 0,
    byScope: {
      city: { income: 0, expense: 0, balance: 0 },
      zone: { income: 0, expense: 0, balance: 0 },
      unit: { income: 0, expense: 0, balance: 0 }
    }
  };

  for (const item of totals) {
    const direction = item._id.direction;
    const scopeType = item._id.scopeType;
    summary[direction] += item.total;
    summary.byScope[scopeType][direction] += item.total;
  }

  summary.balance = summary.income - summary.expense;
  for (const scope of Object.keys(summary.byScope)) {
    summary.byScope[scope].balance = summary.byScope[scope].income - summary.byScope[scope].expense;
  }

  res.json({ summary });
});

export const exportFinanceCsv = asyncHandler(async (req, res) => {
  const filter = applyFinanceFilters(financeQueryForUser(req.user), req.query);
  const records = await FinanceRecord.find(filter)
    .populate("zone", "name code")
    .populate("unit", "name code")
    .populate("recordedBy", "name email")
    .sort({ occurredAt: -1 });

  const csv = toCsv(records, [
    { header: "Date", value: (row) => row.occurredAt },
    { header: "Scope", value: (row) => row.scopeType },
    { header: "Zone", value: (row) => row.zone?.name },
    { header: "Unit", value: (row) => row.unit?.name },
    { header: "Direction", value: (row) => row.direction },
    { header: "Amount", value: (row) => row.amount },
    { header: "Category", value: (row) => row.category },
    { header: "Description", value: (row) => row.description },
    { header: "Payment Method", value: (row) => row.paymentMethod },
    { header: "Reference", value: (row) => row.reference },
    { header: "Recorded By", value: (row) => row.recordedBy?.name }
  ]);

  res.header("Content-Type", "text/csv");
  res.attachment("finance.csv");
  res.send(csv);
});
