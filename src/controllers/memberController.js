import { Member } from "../models/Member.js";
import { Unit } from "../models/Unit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCsv } from "../utils/csv.js";
import { canAccessScope, getRoleLevel } from "../utils/roles.js";

function memberQueryForUser(user) {
  const level = getRoleLevel(user.role);
  if (level === "city") return {};
  if (level === "zone") return { zone: user.zone?._id || user.zone };
  if (level === "unit") return { unit: user.unit?._id || user.unit };
  return { _id: null };
}

function applyMemberFilters(base, query) {
  const filter = { ...base };
  if (query.zone) filter.zone = query.zone;
  if (query.unit) filter.unit = query.unit;
  if (query.status) filter.status = query.status;
  if (query.isShaheen === "true") filter.isShaheen = true;
  if (query.isShaheen === "false") filter.isShaheen = false;
  if (query.search) filter.$text = { $search: query.search };
  return filter;
}

async function unitScope(unitId) {
  const unit = await Unit.findById(unitId);
  if (!unit) return null;
  return { unit: unit._id, zone: unit.zone };
}

export const listMembers = asyncHandler(async (req, res) => {
  const base = memberQueryForUser(req.user);
  const filter = applyMemberFilters(base, req.query);
  const limit = Math.min(Number(req.query.limit) || 100, 250);

  const members = await Member.find(filter)
    .populate("zone", "name code")
    .populate("unit", "name code")
    .populate("shaheenBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ members });
});

export const createMember = asyncHandler(async (req, res) => {
  const { fullName, fatherName, address, className, institution, phone, guardianPhone, cnicOrBForm, dateOfBirth, unit, joinDate, status, notes } = req.body;

  if (!fullName || !address || !className || !unit) {
    return res.status(400).json({ message: "Full name, address, class, and unit are required." });
  }

  const scope = await unitScope(unit);
  if (!scope) return res.status(404).json({ message: "Unit not found." });

  if (!canAccessScope(req.user, "unit", scope.zone, scope.unit)) {
    return res.status(403).json({ message: "You cannot add members to this unit." });
  }

  const member = await Member.create({
    fullName,
    fatherName,
    address,
    className,
    institution,
    phone,
    guardianPhone,
    cnicOrBForm,
    dateOfBirth,
    unit: scope.unit,
    zone: scope.zone,
    joinDate,
    status,
    notes,
    createdBy: req.user._id
  });

  await member.populate("zone", "name code");
  await member.populate("unit", "name code");
  res.status(201).json({ member });
});

export const updateMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Member not found." });

  if (!canAccessScope(req.user, "unit", member.zone, member.unit)) {
    return res.status(403).json({ message: "You cannot update this member." });
  }

  const allowed = ["fullName", "fatherName", "address", "className", "institution", "phone", "guardianPhone", "cnicOrBForm", "dateOfBirth", "joinDate", "status", "notes"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) member[field] = req.body[field];
  }

  if (req.body.unit && String(req.body.unit) !== String(member.unit)) {
    const scope = await unitScope(req.body.unit);
    if (!scope) return res.status(404).json({ message: "New unit not found." });
    if (!canAccessScope(req.user, "unit", scope.zone, scope.unit)) {
      return res.status(403).json({ message: "You cannot move members to this unit." });
    }
    member.unit = scope.unit;
    member.zone = scope.zone;
  }

  member.updatedBy = req.user._id;
  await member.save();
  await member.populate("zone", "name code");
  await member.populate("unit", "name code");

  res.json({ member });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Member not found." });

  if (!canAccessScope(req.user, "unit", member.zone, member.unit)) {
    return res.status(403).json({ message: "You cannot delete this member." });
  }

  await member.deleteOne();
  res.json({ message: "Member deleted." });
});

export const setShaheenStatus = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Member not found." });

  if (!canAccessScope(req.user, "unit", member.zone, member.unit)) {
    return res.status(403).json({ message: "You cannot update this member." });
  }

  const isShaheen = req.body.isShaheen !== false;
  member.isShaheen = isShaheen;
  member.shaheenSince = isShaheen ? new Date() : undefined;
  member.shaheenBy = isShaheen ? req.user._id : undefined;
  member.updatedBy = req.user._id;
  await member.save();
  await member.populate("zone", "name code");
  await member.populate("unit", "name code");
  await member.populate("shaheenBy", "name email");

  res.json({ member });
});

export const exportMembersCsv = asyncHandler(async (req, res) => {
  const base = memberQueryForUser(req.user);
  const filter = applyMemberFilters(base, req.query);
  const members = await Member.find(filter).populate("zone", "name code").populate("unit", "name code").sort({ createdAt: -1 });

  const csv = toCsv(members, [
    { header: "Name", value: (row) => row.fullName },
    { header: "Father Name", value: (row) => row.fatherName },
    { header: "Phone", value: (row) => row.phone },
    { header: "Guardian Phone", value: (row) => row.guardianPhone },
    { header: "Class", value: (row) => row.className },
    { header: "Institution", value: (row) => row.institution },
    { header: "Address", value: (row) => row.address },
    { header: "Zone", value: (row) => row.zone?.name },
    { header: "Unit", value: (row) => row.unit?.name },
    { header: "Shaheen", value: (row) => (row.isShaheen ? "Yes" : "No") },
    { header: "Status", value: (row) => row.status },
    { header: "Join Date", value: (row) => row.joinDate }
  ]);

  res.header("Content-Type", "text/csv");
  res.attachment("members.csv");
  res.send(csv);
});
