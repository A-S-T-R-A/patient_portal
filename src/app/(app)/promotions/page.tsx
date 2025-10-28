"use client";

import { useState } from "react";
import { Tag, Clock, ArrowRight, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const promotions = [
  {
    id: 1,
    title: "20% Off Teeth Whitening",
    description:
      "Get a brighter smile with our professional teeth whitening service. Limited time offer for existing patients.",
    discount: "20% OFF",
    validUntil: "Dec 31, 2025",
    category: "Cosmetic",
  },
  {
    id: 2,
    title: "Free Dental Checkup",
    description:
      "Book your regular checkup this month and get a complimentary oral health assessment worth $150.",
    discount: "FREE",
    validUntil: "Nov 30, 2025",
    category: "Checkup",
  },
  {
    id: 3,
    title: "Family Package - Save $500",
    description:
      "Bring your family for comprehensive dental care. Special package includes checkups, cleaning, and X-rays for up to 4 members.",
    discount: "$500 OFF",
    validUntil: "Jan 15, 2026",
    category: "Package",
  },
];

export default function PromotionsPage() {
  const [claimedOffers, setClaimedOffers] = useState<number[]>([]);
  const [loadingOffers, setLoadingOffers] = useState<number[]>([]);

  const handleClaimOffer = (offerId: number, offerTitle: string) => {
    if (claimedOffers.includes(offerId)) {
      toast.info("You have already claimed this offer!");
      return;
    }

    if (loadingOffers.includes(offerId)) {
      return;
    }

    setLoadingOffers((prev) => [...prev, offerId]);
    setTimeout(() => {
      setClaimedOffers((prev) => [...prev, offerId]);
      setLoadingOffers((prev) => prev.filter((id) => id !== offerId));
      toast.success(`Successfully claimed: ${offerTitle}!`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Special Offers
        </h1>
        <p className="text-muted-foreground">
          Exclusive deals and promotions tailored for you
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => (
          <Card
            key={promo.id}
            className="shadow-md overflow-hidden flex flex-col h-full"
          >
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="mb-2">
                  {promo.category}
                </Badge>
                <Badge className="bg-primary text-primary-foreground">
                  {promo.discount}
                </Badge>
              </div>
              <CardTitle className="text-lg">{promo.title}</CardTitle>
              <CardDescription className="text-sm">
                {promo.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col flex-grow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span>Valid until {promo.validUntil}</span>
              </div>
              <div className="mt-auto">
                <Button
                  className="w-full"
                  onClick={() => handleClaimOffer(promo.id, promo.title)}
                  disabled={
                    claimedOffers.includes(promo.id) ||
                    loadingOffers.includes(promo.id)
                  }
                  variant={
                    claimedOffers.includes(promo.id) ? "secondary" : "default"
                  }
                >
                  {loadingOffers.includes(promo.id) ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Claiming...
                    </>
                  ) : claimedOffers.includes(promo.id) ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Claimed
                    </>
                  ) : (
                    <>
                      Claim Offer
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
