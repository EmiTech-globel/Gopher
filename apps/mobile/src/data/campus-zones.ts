export interface CampusBuilding {
  name: string;
  cluster: string;
}

export const campusBuildings: CampusBuilding[] = [
  { name: "School Gate", cluster: "A" },
  { name: "Admission Block", cluster: "A" },
  { name: "Admin Block", cluster: "A" },
  { name: "Admin Extension", cluster: "A" },
  { name: "Mosque", cluster: "A" },
  { name: "Library", cluster: "A" },
  { name: "Welding Workshop", cluster: "A" },
  { name: "Mechanical Workshop", cluster: "A" },
  { name: "Power House", cluster: "A" },

  { name: "N Block", cluster: "B" },
  { name: "LT", cluster: "B" },
  { name: "Electrical Lab", cluster: "B" },
  { name: "NIEEE Office", cluster: "B" },
  { name: "Academic Block", cluster: "B" },
  { name: "SH / Consult Block", cluster: "B" },

  { name: "Clinic", cluster: "C" },
  { name: "Staff Quarters", cluster: "C" },

  { name: "LH Block", cluster: "D" },
  { name: "UB Block", cluster: "D" },
  { name: "ELF Block", cluster: "D" },
  { name: "Church Village", cluster: "D" },

  { name: "PTDF Hotel (Boys Wing)", cluster: "E" },
  { name: "PTDF Hotel (Girls Wing)", cluster: "E" },
  { name: "PTDF Hotel Shop", cluster: "E" },
  { name: "NDDC Hotel (Female)", cluster: "E" },
  { name: "Computer Village", cluster: "E" },

  { name: "Swimming Pool", cluster: "F" },
  { name: "Lawn Tennis Court", cluster: "F" },
  { name: "Pico Hall", cluster: "F" },

  { name: "New Lab / Tutu Restaurant", cluster: "G" },
  { name: "Rig", cluster: "G" },

  { name: "Football Field / Basketball Court", cluster: "H" },

  { name: "Noble Hostel (Female)", cluster: "I" },
  { name: "Noble Hotel Shop", cluster: "I" },
  { name: "Fantalizer", cluster: "I" },

  { name: "Student Mess", cluster: "J" },
  { name: "Old Boys Hostel (Kokori)", cluster: "J" },
  { name: "Old Boys Hostel (Ebusha)", cluster: "J" },
  { name: "Old Boys Hostel (Akwa Ibom)", cluster: "J" },
  { name: "Old Boys Hostel (Aso Rock)", cluster: "J" },
  { name: "Old Boys Hostel Shop", cluster: "J" },
  { name: "Buttery", cluster: "J" },
];

const ADJACENT_CLUSTERS: Record<string, string[]> = {
  A: ["B", "F"],
  B: ["A", "C", "J"],
  C: ["B", "D", "J"],
  D: ["C", "E"],
  E: ["D"],
  F: ["A", "G"],
  G: ["F", "H"],
  H: ["G", "I"],
  I: ["H"],
  J: ["B", "C"],
};

export type DeliveryFeeTier = 1 | 2 | 3;

// Placeholder fee table — per README, real zone/coordinate-based pricing
// is deferred; these are flat estimates per tier, adjustable any time
// without touching the tier logic itself.
export const DELIVERY_FEE_BY_TIER: Record<DeliveryFeeTier, number> = {
  1: 100,
  2: 200,
  3: 350,
};

export function getDeliveryFeeTier(pickupBuilding: string, dropoffBuilding: string): DeliveryFeeTier {
  const pickup = campusBuildings.find((b) => b.name === pickupBuilding);
  const dropoff = campusBuildings.find((b) => b.name === dropoffBuilding);

  if (!pickup || !dropoff) return 3;
  if (pickup.cluster === dropoff.cluster) return 1;
  if (ADJACENT_CLUSTERS[pickup.cluster]?.includes(dropoff.cluster)) return 2;
  return 3;
}

export function getSuggestedDeliveryFee(pickupBuilding: string, dropoffBuilding: string): number {
  const tier = getDeliveryFeeTier(pickupBuilding, dropoffBuilding);
  return DELIVERY_FEE_BY_TIER[tier];
}