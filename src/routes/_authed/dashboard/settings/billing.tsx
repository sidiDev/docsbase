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
import {
  CreditCard,
  Download,
  Calendar,
  Check,
  Zap,
  Crown,
  ArrowUpRight,
  FileText,
  DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard/settings/billing")({
  component: RouteComponent,
});

function RouteComponent() {
  const invoices = [
    {
      id: "INV-2024-001",
      date: "Mar 1, 2024",
      amount: "$29.00",
      status: "Paid",
      downloadUrl: "#",
    },
    {
      id: "INV-2024-002",
      date: "Feb 1, 2024",
      amount: "$29.00",
      status: "Paid",
      downloadUrl: "#",
    },
    {
      id: "INV-2024-003",
      date: "Jan 1, 2024",
      amount: "$29.00",
      status: "Paid",
      downloadUrl: "#",
    },
  ];

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
          {/* Plan Details */}
          <div className="flex items-start justify-between p-6 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">Pro Plan</h3>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  Current
                </Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited documentation crawls
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Advanced AI features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  API access
                </li>
              </ul>
            </div>
            <Button variant="outline" size="sm">
              Change Plan
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Billing Cycle */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Next billing date</p>
              <p className="text-xs text-muted-foreground">April 1, 2024</p>
            </div>
            <Badge variant="secondary">Auto-renew enabled</Badge>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancel Subscription</Button>
            <Button variant="outline">Update Plan</Button>
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
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                Remove
              </Button>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Usage This Month
          </CardTitle>
          <CardDescription>
            Track your usage and remaining quota
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Calls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API Calls</span>
              <span className="font-medium">2,450 / 10,000</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: "24.5%" }}
              />
            </div>
          </div>

          <Separator />

          {/* Documentation Crawls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Documentation Crawls
              </span>
              <span className="font-medium">12 / Unlimited</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <Separator />

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">3.2 GB / 50 GB</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: "6.4%" }}
              />
            </div>
          </div>
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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-green-500/10 text-green-700 dark:text-green-400"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Billing Contact */}
      <Card>
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
      </Card>
    </div>
  );
}
