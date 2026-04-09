export const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return value.id || value._id || "";
};

