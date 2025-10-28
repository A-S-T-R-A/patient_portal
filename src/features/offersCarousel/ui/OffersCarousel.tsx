"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { Gift, Star, Eye, ShoppingCart } from "lucide-react";

interface Offer {
  id: string;
  title: string;
  subtitle?: string;
  priceNow: number;
  priceOld?: number;
  discountPercent?: number;
  cta: "View" | "Buy" | "Book";
}

export function OffersCarousel() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offers/list");
      const data = await response.json();
      setOffers(data);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load offers",
        type: "error",
      });
    }
  };

  const handleViewOffer = async (offer: Offer) => {
    try {
      // Track view
      await fetch(`/api/offers/${offer.id}/view`, {
        method: "POST",
      });

      setSelectedOffer(offer);
      setIsDetailsOpen(true);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load offer details",
        type: "error",
      });
    }
  };

  const handleClaimOffer = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/claim`, {
        method: "POST",
      });

      if (response.ok) {
        addToast({
          title: "Offer Saved",
          description: "Your interest has been noted",
          type: "success",
        });
        setIsDetailsOpen(false);
      } else {
        throw new Error("Failed to claim offer");
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to save offer",
        type: "error",
      });
    }
  };

  const formatPrice = (price: number): string => {
    return `$${price}`;
  };

  const calculateSavings = (
    originalPrice: number,
    currentPrice: number
  ): number => {
    return originalPrice - currentPrice;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-500" />
          Recommended for You
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Star className="h-8 w-8 text-gray-400" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm">{offer.title}</h3>
                    {offer.discountPercent && (
                      <Badge variant="destructive" className="text-xs">
                        {offer.discountPercent}% OFF
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">{offer.subtitle}</p>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-green-600">
                      {formatPrice(offer.priceNow)}
                    </span>
                    {offer.priceOld && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(offer.priceOld)}
                      </span>
                    )}
                    {offer.priceOld && (
                      <span className="text-xs text-green-600 font-medium">
                        Save{" "}
                        {formatPrice(
                          calculateSavings(offer.priceOld, offer.priceNow)
                        )}
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewOffer(offer)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Offer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedOffer?.title}</DialogTitle>
            </DialogHeader>
            {selectedOffer && (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">{selectedOffer.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-green-600">
                    {formatPrice(selectedOffer.priceNow)}
                  </span>
                  {selectedOffer.priceOld && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(selectedOffer.priceOld)}
                    </span>
                  )}
                  {selectedOffer.discountPercent && (
                    <Badge variant="destructive" className="text-xs">
                      {selectedOffer.discountPercent}% OFF
                    </Badge>
                  )}
                </div>

                {selectedOffer.priceOld && (
                  <div className="text-sm text-green-600">
                    You save{" "}
                    {formatPrice(
                      calculateSavings(
                        selectedOffer.priceOld,
                        selectedOffer.priceNow
                      )
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleClaimOffer(selectedOffer.id)}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {selectedOffer.cta}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
