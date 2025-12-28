import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Users,
  Package,
  Wand2,
  Upload,
  Store,
  Truck,
  ArrowRight,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20 px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Hero Content */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI-Powered Design
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  AI-Powered Custom Apparel for{" "}
                  <span className="text-primary">Teams & Businesses</span>
                </h1>
                <p className="text-lg text-muted-foreground sm:text-xl">
                  Generate unique designs instantly. Coordinate group orders
                  effortlessly. Ship directly to your team.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start Designing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#how-it-works">Watch Demo</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>No minimums</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Fast turnaround</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Premium quality</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative flex items-center justify-center">
              <div className="relative h-[400px] w-full rounded-xl border bg-gradient-to-br from-primary/10 via-accent/10 to-background p-8 shadow-2xl lg:h-[500px]">
                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                  <Wand2 className="h-16 w-16 text-primary" />
                  <p className="text-lg font-semibold">Design Studio Preview</p>
                  <p className="text-sm text-muted-foreground">
                    AI-powered design tools coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for custom apparel
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From design to delivery, we handle it all
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Feature 1: AI Design Generator */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Design Generator</CardTitle>
                <CardDescription>
                  Turn your ideas into print-ready designs in seconds with
                  DALL-E 3
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Text-to-image AI generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Instant design variations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Professional print quality</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2: Smart Group Ordering */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Group Ordering</CardTitle>
                <CardDescription>
                  Share a link. Members order individually. We handle the rest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Individual size selection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Automated payment collection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Order tracking dashboard</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3: Zero Inventory Risk */}
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Zero Inventory Risk</CardTitle>
                <CardDescription>
                  Print-on-demand fulfillment. No MOQs. Direct shipping.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Order as few as 1 item</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Printful integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span>Worldwide shipping</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="border-y bg-muted/40 px-4 py-20 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From idea to reality in four simple steps
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Describe or Upload
              </h3>
              <p className="text-sm text-muted-foreground">
                Describe your design idea or upload your own logo
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Wand2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Generate & Customize
              </h3>
              <p className="text-sm text-muted-foreground">
                AI creates unique designs or customize manually with our editor
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Create Storefront</h3>
              <p className="text-sm text-muted-foreground">
                Set up a group order or purchase directly for yourself
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                4
              </div>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Receive Quality</h3>
              <p className="text-sm text-muted-foreground">
                High-quality apparel ships directly to your door
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Trusted by thousands
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Perfect for any organization
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Trusted by sports teams, corporations, and event organizers
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Customer Segment 1 */}
            <Card>
              <CardHeader>
                <CardTitle>Sports Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Youth leagues, competitive teams, and recreational clubs use
                  Regalia for custom uniforms and team gear.
                </p>
              </CardContent>
            </Card>

            {/* Customer Segment 2 */}
            <Card>
              <CardHeader>
                <CardTitle>Corporations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Companies order branded apparel for employees, events, and
                  corporate gifts with ease.
                </p>
              </CardContent>
            </Card>

            {/* Customer Segment 3 */}
            <Card>
              <CardHeader>
                <CardTitle>Event Organizers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Conferences, fundraisers, and family reunions create memorable
                  custom merchandise.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-t bg-primary px-4 py-20 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to create your custom apparel?
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Join thousands of teams and businesses who trust Regalia for
            their custom apparel needs.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="text-primary"
              asChild
            >
              <Link href="/signup">
                Start Designing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
