import { Unit } from "../models/Unit.js";
import { Zone } from "../models/Zone.js";
import { canAccessScope, canWriteFinance } from "./roles.js";

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function resolveScope({ scopeType, zone, unit }) {
  if (scopeType === "city") {
    return { scopeType: "city", zone: undefined, unit: undefined };
  }

  if (scopeType === "zone") {
    if (!zone) throw httpError(400, "Zone is required for a zone-level record.");
    const zoneDoc = await Zone.findById(zone);
    if (!zoneDoc) throw httpError(404, "Zone not found.");
    return { scopeType: "zone", zone: zoneDoc._id, unit: undefined };
  }

  if (scopeType === "unit") {
    if (!unit) throw httpError(400, "Unit is required for a unit-level record.");
    const unitDoc = await Unit.findById(unit);
    if (!unitDoc) throw httpError(404, "Unit not found.");
    return { scopeType: "unit", zone: unitDoc.zone, unit: unitDoc._id };
  }

  throw httpError(400, "Invalid scopeType.");
}

export function assertCanAccess(user, scope) {
  if (!canAccessScope(user, scope.scopeType, scope.zone, scope.unit)) {
    throw httpError(403, "You do not have access to this scope.");
  }
}

export function assertCanWriteFinance(user, scope) {
  if (!canWriteFinance(user, scope.scopeType, scope.zone, scope.unit)) {
    throw httpError(403, "You cannot write finance records for this scope.");
  }
}
