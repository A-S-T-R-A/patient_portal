import { Tag, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const promotions = [
  {
    id: 1,
    title: "20% Off Teeth Whitening",
    description: "Get a brighter smile with our professional teeth whitening service. Limited time offer for existing patients.",
    discount: "20% OFF",
    validUntil: "Dec 31, 2025",
    category: "Cosmetic",
    image: "gradient-from-primary-to-primary-light",
  },
  {
    id: 2,
    title: "Free Dental Checkup",
    description: "Book your regular checkup this month and get a complimentary oral health assessment worth $150.",
    discount: "FREE",
    validUntil: "Nov 30, 2025",
    category: "Checkup",
    image: "gradient-from-accent-to-accent-light",
  },
  {
    id: 3,
    title: "Family Package - Save $500",
    description: "Bring your family for comprehensive dental care. Special package includes checkups, cleaning, and X-rays for up to 4 members.",
    discount: "$500 OFF",
    validUntil: "Jan 15, 2026",
    category: "Package",
    image: "gradient-from-primary-to-accent",
  },
  {
    id: 4,
    title: "Orthodontic Consultation",
    description: "Considering braces or clear aligners? Get a free orthodontic consultation and treatment plan.",
    discount: "FREE",
    validUntil: "Dec 15, 2025",
    category: "Orthodontics",
    image: "gradient-from-accent-to-primary",
  },
];

const Promotions = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Special Offers
        </h1>
        <p className="text-muted-foreground">
          Exclusive promotions and offers just for you
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {promotions.map((promo) => (
          <Card key={promo.id} className="overflow-hidden shadow-md transition-all hover:shadow-lg">
            <div className={`h-32 bg-${promo.image} p-6`}>
              <div className="flex items-start justify-between">
                <Badge className="bg-white/90 text-primary hover:bg-white">
                  {promo.category}
                </Badge>
                <div className="rounded-lg bg-white/90 px-3 py-1">
                  <p className="text-lg font-bold text-primary">{promo.discount}</p>
                </div>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                {promo.title}
              </CardTitle>
              <CardDescription>{promo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Valid until {promo.validUntil}</span>
                </div>
                <Button className="w-full" size="lg">
                  Claim Offer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Promotions;
