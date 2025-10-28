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

export const validateNotificationSettings = (settings: any): boolean => {
  if (typeof settings !== "object" || settings === null) return false;

  if ("pushEnabled" in settings && typeof settings.pushEnabled !== "boolean") {
    return false;
  }

  if ("categories" in settings) {
    if (
      typeof settings.categories !== "object" ||
      settings.categories === null
    ) {
      return false;
    }

    const validCategories = ["reminders", "offers", "updates"];
    for (const key of Object.keys(settings.categories)) {
      if (
        !validCategories.includes(key) ||
        typeof settings.categories[key] !== "boolean"
      ) {
        return false;
      }
    }
  }

  return true;
};
