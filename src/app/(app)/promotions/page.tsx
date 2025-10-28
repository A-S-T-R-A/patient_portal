import { Tag, Clock, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
          <Card key={promo.id} className="shadow-md overflow-hidden">
            <CardHeader className="pb-3">
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
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span>Valid until {promo.validUntil}</span>
              </div>
              <Button className="w-full">
                Claim Offer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
