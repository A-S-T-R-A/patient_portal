import { Offer } from "@/shared/config/types";

export const mockOffers: Offer[] = [
  {
    id: "1",
    title: "Whitening Package",
    subtitle: "Professional teeth whitening treatment",
    priceNow: 299,
    priceOld: 399,
    discountPercent: 25,
    cta: "Buy",
  },
  {
    id: "2",
    title: "Night Guard Discount",
    subtitle: "Custom night guard with 20% off",
    priceNow: 199,
    priceOld: 249,
    discountPercent: 20,
    cta: "Book",
  },
  {
    id: "3",
    title: "Dental Cleaning",
    subtitle: "Comprehensive dental cleaning",
    priceNow: 89,
    priceOld: 120,
    discountPercent: 26,
    cta: "Book",
  },
];

export const formatPrice = (price: number): string => {
  return `$${price}`;
};

export const calculateSavings = (
  originalPrice: number,
  currentPrice: number
): number => {
  return originalPrice - currentPrice;
};
