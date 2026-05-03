import { FinanceRecord } from "../models/FinanceRecord.js";
import { Member } from "../models/Member.js";
import { PostAssignment } from "../models/PostAssignment.js";
import { Unit } from "../models/Unit.js";
import { Zone } from "../models/Zone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertCanAccess, resolveScope } from "../utils/scope.js";
import { canAccessScope, getRoleLevel, sameId } from "../utils/roles.js";

function canCreateStructure(user, scopeType, zoneId) {
  if (user.role === "city_president" || user.role === "city_vice_president") return true;
  if (scopeType === "unit" && user.role === "zone_president") {
    return sameId(user.zone, zoneId);
  }
  return false;
}

function zoneQueryForUser(user) {
  const level = getRoleLevel(user.role);
  if (level === "city") return {};
  return { _id: user.zone?._id || user.zone };
}

function unitQueryForUser(user) {
  const level = getRoleLevel(user.role);
  if (level === "city") return {};
  if (level === "zone") return { zone: user.zone?._id || user.zone };
  if (level === "unit") return { _id: user.unit?._id || user.unit };
  return { _id: null };
}

function memberQueryForUser(user) {
  const level = getRoleLevel(user.role);
  if (level === "city") return {};
  if (level === "zone") return { zone: user.zone?._id || user.zone };
  if (level === "unit") return { unit: user.unit?._id || user.unit };
  return { _id: null };
}

export const overview = asyncHandler(async (req, res) => {
  const zones = await Zone.find(zoneQueryForUser(req.user)).sort({ code: 1 });
  const zoneIds = zones.map((zone) => zone._id);
  const unitQuery = unitQueryForUser(req.user);
  const memberQuery = memberQueryForUser(req.user);

  const [units, membersCount, shaheenCount, financeTotals] = await Promise.all([
    Unit.find(unitQuery).populate("zone", "name code").sort({ code: 1 }),
    Member.countDocuments(memberQuery),
    Member.countDocuments({ ...memberQuery, isShaheen: true }),
    FinanceRecord.aggregate([
      {
        $match:
          getRoleLevel(req.user.role) === "city"
            ? {}
            : getRoleLevel(req.user.role) === "zone"
              ? { zone: req.user.zone?._id || req.user.zone }
              : { unit: req.user.unit?._id || req.user.unit }
      },
      {
        $group: {
          _id: "$direction",
          total: { $sum: "$amount" }
        }
      }
    ])
  ]);

  const unitCounts = units.reduce((acc, unit) => {
    const key = String(unit.zone?._id || unit.zone);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const finance = financeTotals.reduce(
    (acc, item) => {
      acc[item._id] = item.total;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  res.json({
    stats: {
      zones: zones.length || zoneIds.length,
      units: units.length,
      members: membersCount,
      shaheens: shaheenCount,
      income: finance.income || 0,
      expense: finance.expense || 0,
      balance: (finance.income || 0) - (finance.expense || 0)
    },
    zones: zones.map((zone) => ({
      ...zone.toObject(),
      unitCount: unitCounts[String(zone._id)] || 0
    })),
    units
  });
});

export const listZones = asyncHandler(async (req, res) => {
  const zones = await Zone.find(zoneQueryForUser(req.user)).sort({ code: 1 });
  res.json({ zones });
});

export const createZone = asyncHandler(async (req, res) => {
  if (!canCreateStructure(req.user, "zone")) {
    return res.status(403).json({ message: "Only city leadership can create zones." });
  }

  const { name, code, description } = req.body;
  if (!name || !code) {
    return res.status(400).json({ message: "Zone name and code are required." });
  }

  const zone = await Zone.create({ name, code, description, createdBy: req.user._id });
  res.status(201).json({ zone });
});

export const updateZone = asyncHandler(async (req, res) => {
  const zone = await Zone.findById(req.params.id);
  if (!zone) return res.status(404).json({ message: "Zone not found." });

  if (!canAccessScope(req.user, "zone", zone._id) || !canCreateStructure(req.user, "zone")) {
    return res.status(403).json({ message: "You cannot update this zone." });
  }

  const allowed = ["name", "code", "description", "isActive"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) zone[field] = req.body[field];
  }
  await zone.save();

  res.json({ zone });
});

export const listUnits = asyncHandler(async (req, res) => {
  const units = await Unit.find(unitQueryForUser(req.user)).populate("zone", "name code").sort({ code: 1 });
  res.json({ units });
});

export const createUnit = asyncHandler(async (req, res) => {
  const { name, code, zone, area, meetingDay } = req.body;
  if (!name || !code || !zone) {
    return res.status(400).json({ message: "Unit name, code, and zone are required." });
  }

  if (!canCreateStructure(req.user, "unit", zone)) {
    return res.status(403).json({ message: "You cannot create units in this zone." });
  }

  const zoneDoc = await Zone.findById(zone);
  if (!zoneDoc) return res.status(404).json({ message: "Zone not found." });

  const unit = await Unit.create({ name, code, zone, area, meetingDay, createdBy: req.user._id });
  await unit.populate("zone", "name code");

  res.status(201).json({ unit });
});

export const updateUnit = asyncHandler(async (req, res) => {
  const unit = await Unit.findById(req.params.id);
  if (!unit) return res.status(404).json({ message: "Unit not found." });

  if (!canCreateStructure(req.user, "unit", unit.zone)) {
    return res.status(403).json({ message: "You cannot update this unit." });
  }

  const allowed = ["name", "code", "area", "meetingDay", "isActive"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) unit[field] = req.body[field];
  }

  if (req.body.zone && String(req.body.zone) !== String(unit.zone)) {
    if (!canCreateStructure(req.user, "unit", req.body.zone)) {
      return res.status(403).json({ message: "You cannot move units to this zone." });
    }
    const zoneDoc = await Zone.findById(req.body.zone);
    if (!zoneDoc) return res.status(404).json({ message: "Zone not found." });
    unit.zone = zoneDoc._id;
  }

  await unit.save();
  await unit.populate("zone", "name code");

  res.json({ unit });
});

export const listPostAssignments = asyncHandler(async (req, res) => {
  const level = getRoleLevel(req.user.role);
  const query =
    level === "city"
      ? {}
      : level === "zone"
        ? { zone: req.user.zone?._id || req.user.zone }
        : { unit: req.user.unit?._id || req.user.unit };

  const assignments = await PostAssignment.find(query)
    .populate("zone", "name code")
    .populate("unit", "name code")
    .populate("user", "name email role")
    .populate("member", "fullName phone")
    .sort({ scopeType: 1, title: 1, startedAt: -1 });

  res.json({ assignments });
});

export const createPostAssignment = asyncHandler(async (req, res) => {
  const { scopeType, zone, unit, title, customTitle, user, member, startedAt } = req.body;
  const scope = await resolveScope({ scopeType, zone, unit });
  assertCanAccess(req.user, scope);

  if (!title || (title === "other" && !customTitle)) {
    return res.status(400).json({ message: "Post title is required." });
  }

  await PostAssignment.updateMany(
    {
      scopeType: scope.scopeType,
      zone: scope.zone,
      unit: scope.unit,
      title,
      isActive: true
    },
    { isActive: false, endedAt: new Date() }
  );

  const assignment = await PostAssignment.create({
    scopeType: scope.scopeType,
    zone: scope.zone,
    unit: scope.unit,
    title,
    customTitle,
    user,
    member,
    startedAt,
    assignedBy: req.user._id
  });

  await assignment.populate("zone", "name code");
  await assignment.populate("unit", "name code");
  await assignment.populate("user", "name email role");
  await assignment.populate("member", "fullName phone");

  res.status(201).json({ assignment });
});
