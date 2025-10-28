// Simple validation functions
export const validateStepId = (stepId: string): boolean => {
  return typeof stepId === "string" && stepId.length > 0;
};

export const validateDateISO = (dateISO: string): boolean => {
  try {
    const date = new Date(dateISO);
    return !isNaN(date.getTime()) && dateISO.includes("T");
  } catch {
    return false;
  }
};

export const validateMessageText = (text: string): boolean => {
  return (
    typeof text === "string" && text.trim().length > 0 && text.length <= 1000
  );
};

export const validateOfferId = (offerId: string): boolean => {
  return typeof offerId === "string" && offerId.length > 0;
};

export const validateNotificationSettings = (settings: unknown): boolean => {
  if (typeof settings !== "object" || settings === null) return false;

  const settingsObj = settings as Record<string, unknown>;

  if (
    "pushEnabled" in settingsObj &&
    typeof settingsObj.pushEnabled !== "boolean"
  ) {
    return false;
  }

  if ("categories" in settingsObj) {
    if (
      typeof settingsObj.categories !== "object" ||
      settingsObj.categories === null
    ) {
      return false;
    }

    const categoriesObj = settingsObj.categories as Record<string, unknown>;
    const validCategories = ["reminders", "offers", "updates"];
    for (const key of Object.keys(categoriesObj)) {
      if (
        !validCategories.includes(key) ||
        typeof categoriesObj[key] !== "boolean"
      ) {
        return false;
      }
    }
  }

  return true;
};
