import { describe, expect, it } from "vitest";
import {
  getServiceMatchStatus,
  getServicesByChannel,
  NO_SERVICE_ID,
  SERVICE_CHANNEL_ORDER,
  SERVICE_CATALOG,
  serviceDisplayLabel,
  validateServicePriorities
} from "./service-catalog";

describe("service catalog", () => {
  it("contains the approved 49 uniquely identifiable services", () => {
    expect(SERVICE_CATALOG).toHaveLength(49);
    expect(new Set(SERVICE_CATALOG.map((service) => service.id)).size).toBe(49);
    expect(SERVICE_CATALOG.map((service) => service.probablePrimaryType).sort()).toEqual(
      expect.arrayContaining(["M", "A", "S", "T"])
    );
  });

  it("keeps services grouped by their approved channels and MAST types", () => {
    expect(SERVICE_CHANNEL_ORDER).toHaveLength(7);
    expect(getServicesByChannel("વહીવટ").map((service) => service.id)).toEqual(
      expect.arrayContaining(["apn", "apms", "group-leader", "computer-it-operator"])
    );
    expect(SERVICE_CATALOG.find((service) => service.id === "bms")?.probablePrimaryType).toBe("S");
    expect(SERVICE_CATALOG.find((service) => service.id === "event-coordinator")?.probablePrimaryType).toBe("A");
  });

  it("keeps old saved service IDs and display labels compatible", () => {
    const legacyIds = ["bps", "bpn", "kms", "sms", "sds", "apn", "abs-primary", "sdk", "kitchen-manager", "seva-karyakar"];
    expect(legacyIds.every((id) => SERVICE_CATALOG.some((service) => service.id === id))).toBe(true);
    expect(serviceDisplayLabel(SERVICE_CATALOG.find((service) => service.id === "group-leader")!)).toBe("ગ્રુપ લીડર");
    expect(serviceDisplayLabel(SERVICE_CATALOG.find((service) => service.id === "kitchen-member")!)).toBe("રસોડા સભ્ય");
  });

  it("requires priority 1 and rejects duplicate services", () => {
    expect(validateServicePriorities([]).valid).toBe(false);
    expect(validateServicePriorities(["sms", "sms"]).valid).toBe(false);
    expect(validateServicePriorities(["sms", "ss", "sk"]).valid).toBe(true);
  });

  it("allows no service only by itself", () => {
    expect(validateServicePriorities([NO_SERVICE_ID]).valid).toBe(true);
    expect(validateServicePriorities([NO_SERVICE_ID, "sms"]).valid).toBe(false);
  });

  it("does not repeat a service name when its code is already part of it", () => {
    expect(serviceDisplayLabel(SERVICE_CATALOG.find((service) => service.id === "abs-primary")!)).toBe("ABS Primary સંચાલક");
    expect(serviceDisplayLabel(SERVICE_CATALOG.find((service) => service.id === "service-manager")!)).toBe("સેવા વ્યવસ્થાપક");
    expect(serviceDisplayLabel(SERVICE_CATALOG.find((service) => service.id === "bps")!)).toBe("BPS — બાળ પ્રવૃત્તિ સંયોજક");
  });

  it("does not show a match before a valid result", () => {
    expect(getServiceMatchStatus({ serviceId: "sms", primaryType: "M", valid: "Valid" })).toBe("matched");
    expect(getServiceMatchStatus({ serviceId: "sms", primaryType: "A", valid: "Valid" })).toBe("not_matched");
    expect(getServiceMatchStatus({ serviceId: "sms", primaryType: "M", valid: "Invalid" })).toBe("pending");
    expect(getServiceMatchStatus({ serviceId: "sms", primaryType: "M", valid: null })).toBe("pending");
  });
});
