
export const departments: { [key: string]: string } = {
  "sales-team": "Sales Team",
  "operations-team": "Operations Team",
  "marketing-and-media-creatives": "Marketing and Media Creatives",
  "logistic": "Logistic",
};

export const getDepartmentName = (slug: string): string => {
  return departments[slug] || slug;
};

export const getDepartmentOptions = (): Array<{ value: string; label: string }> => {
  return Object.entries(departments).map(([value, label]) => ({
    value,
    label,
  }));
};

export const getDepartmentSlugs = (): string[] => {
  return Object.keys(departments);
};

export const getDepartmentNames = (): string[] => {
  return Object.values(departments);
};
