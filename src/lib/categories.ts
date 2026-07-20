export const CATEGORIES = [
  { slug: "neurorehabilitation", label: "Neurorehabilitation" },
  { slug: "virtual-reality", label: "Virtual Reality" },
  { slug: "biomechanics", label: "Biomechanics" },
  { slug: "wearable-technology", label: "Wearable Technology" },
  { slug: "robotics", label: "Robotics & Automation" },
  { slug: "motor-learning", label: "Motor Learning" },
  { slug: "pediatric-rehabilitation", label: "Pediatric Rehabilitation" },
  { slug: "digital-health", label: "Digital Health" },
] as const;

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.label]),
);
