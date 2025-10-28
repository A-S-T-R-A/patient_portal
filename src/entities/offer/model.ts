import { Offer } from "@/shared/config/types";

export const mockOffers: Offer[] = [
  {
    id: "1",
    title: "Whitening Package",
    description: "Professional teeth whitening treatment",
    price: 299,
    originalPrice: 399,
    image: "/api/placeholder/300/200",
    discount: 25,
  },
  {
    id: "2",
    title: "Night Guard Discount",
    description: "Custom night guard with 20% off",
    price: 199,
    originalPrice: 249,
    image: "/api/placeholder/300/200",
    discount: 20,
  },
  {
    id: "3",
    title: "Dental Cleaning",
    description: "Comprehensive dental cleaning",
    price: 89,
    originalPrice: 120,
    image: "/api/placeholder/300/200",
    discount: 26,
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
