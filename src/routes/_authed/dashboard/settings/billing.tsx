import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Calendar, Check, Crown, FileText } from "lucide-react";
import { useCustomer, CheckoutDialog } from "autumn-js/react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import moment from "moment";

export const Route = createFileRoute("/_authed/dashboard/settings/billing")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    customer,
    openBillingPortal,
    checkout,
    cancel,
    check,
    isLoading: isCustomerLoading,
  } = useCustomer({ expand: ["invoices", "payment_method"] });

  const [isLoading, setIsLoading] = useState(false);

  if (isCustomerLoading) {
    return <Spinner className="mx-auto size-5" />;
  }

  const {
    data: { allowed },
  } = check({ productId: "docsbase" });

  if (!allowed || !customer) {
    return (
      <section className="max-w-3xl flex-1">
        <div className="">
          <div className="grid gap-6 xl:grid-cols-5 xl:gap-0">
            <div className="rounded-(--radius) flex flex-col justify-between space-y-8 border p-6 xl:col-span-2 xl:my-2 xl:rounded-r-none xl:border-r-0 lg:p-10">
              <div className="space-y-4">
                <div>
                  <h2 className="font-medium">Free</h2>
                  <span className="my-3 block text-2xl font-semibold">
                    $0 / mo
                  </span>
                  <p className="text-muted-foreground text-sm">Per editor</p>
                </div>
                <hr className="border-dashed" />

                <ul className="list-outside space-y-3 text-sm">
                  {[
                    "1 documentation crawler",
                    "1000 AI chat messages",
                    "Basic chat interface",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="dark:bg-muted rounded-(--radius) border p-6 shadow-lg shadow-gray-950/5 xl:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h2 className="font-medium">Pro</h2>
                    <span className="my-3 block text-2xl font-semibold">
                      $19 / mo
                    </span>
                    <p className="text-muted-foreground text-sm">Per editor</p>
                  </div>

                  <Button
                    onClick={() => {
                      setIsLoading(true);
                      checkout({
                        productId: "docsbase",
                        dialog: CheckoutDialog,
                        successUrl: location.href,
                      });
                    }}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Upgrade
                  </Button>
                </div>

                <div>
                  <div className="text-sm font-medium">
                    Everything in free plus :
                  </div>

                  <ul className="mt-4 list-outside space-y-3 text-sm">
                    {[
                      "Unlimited documentation sources",
                      "Unlimited AI chat messages",
                      "Advanced AI model",
                      "Unlimited chat history",
                      "Advanced search",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="size-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Existing billing management UI for paid users
  return (
    <div className="flex-1 space-y-6 max-w-3xl">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Billing Cycle */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Next billing date</p>
              <p className="text-xs text-muted-foreground">
                {moment(customer?.products[0]?.current_period_end).format("LL")}
              </p>
            </div>
            <Badge variant="secondary">Auto-renew enabled</Badge>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                cancel({ productId: "docsbase" }).then(() => {
                  location.reload();
                });
              }}
            >
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Manage your payment methods and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium">
                  •••• •••• •••• {customer.payment_method?.card?.last4}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires {customer.payment_method?.card?.exp_month}/
                  {customer.payment_method?.card?.exp_year}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await openBillingPortal({
                returnUrl: "https://useautumn.com/settings/billing",
                openInNewTab: true,
              });
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer?.invoices?.map((invoice) => (
                <TableRow key={invoice.created_at}>
                  <TableCell className="font-medium">ID</TableCell>
                  <TableCell>
                    {moment(invoice.created_at).format("MMM Do YY")}
                  </TableCell>
                  <TableCell>${invoice.total}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-green-500/10 text-green-700 dark:text-green-400"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      {invoice.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Billing Contact
          </CardTitle>
          <CardDescription>
            Update billing contact information and address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <p className="text-sm font-medium">Company Name</p>
              <p className="text-sm text-muted-foreground">Acme Corporation</p>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Billing Email</p>
              <p className="text-sm text-muted-foreground">billing@acme.com</p>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-muted-foreground">
                123 Business St, Suite 100
                <br />
                San Francisco, CA 94105
                <br />
                United States
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Update Billing Information
          </Button>
        </CardContent>
      </Card> */}
    </div>
  );
}
