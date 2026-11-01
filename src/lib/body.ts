// Body measurements: key, label, unit, valid range, whether lower is the usual goal.
export const MEASURES = [
  ["weightKg", "Weight", "kg", 20, 300, null], ["bodyFat", "Body fat", "%", 2, 70, "down"], ["waistCm", "Waist", "cm", 30, 250, "down"],
  ["chestCm", "Chest", "cm", 30, 250, null], ["hipsCm", "Hips", "cm", 30, 250, null], ["armCm", "Arm", "cm", 10, 100, "up"],
  ["thighCm", "Thigh", "cm", 20, 150, null], ["calfCm", "Calf", "cm", 15, 80, null], ["neckCm", "Neck", "cm", 20, 70, null],
] as const;
export type MeasureKey = (typeof MEASURES)[number][0];
