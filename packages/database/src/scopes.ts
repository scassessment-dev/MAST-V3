import type { AdminRole, AdminSession } from "./auth";

export function canUseZoneFilter(role: AdminRole): boolean {
  return role === "MASTER_ADMIN";
}

export function canUseCenterFilter(role: AdminRole): boolean {
  return role === "MASTER_ADMIN" || role === "ZONE_ADMIN";
}

export function isResponseInScope(
  session: AdminSession,
  response: { zoneId: string; centerId: string; gender?: "Male" | "Female" | string }
): boolean {
  // Gender visibility check: Male admins see only Male, Female admins see only Female, Main Master sees All
  if (session.genderScope && session.genderScope !== "All" && response.gender) {
    if (response.gender !== session.genderScope) {
      return false;
    }
  }

  if (session.role === "MASTER_ADMIN") return true;
  if (session.role === "ZONE_ADMIN") return response.zoneId === session.zoneId;
  return response.centerId === session.centerId;
}
