import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import moment from "moment";
import { motion } from "motion/react";
import {
  Network,
  Layers,
  ChevronDown,
  Globe,
  Tag,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import AddDocs from "@/components/AddDocs";
import Brand from "@/components/Brand";

export const Route = createFileRoute("/_authed/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useUser();

  const [isCrawlingExpanded, setIsCrawlingExpanded] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [startCrawling, setStartCrawling] = useState(false);

  const docs = useQuery(
    api.docs.getDocsByExternalId,
    user?.id ? { externalId: user.id, noPages: false } : "skip"
  );

  if (!docs) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">
          <Spinner className="size-5 mx-auto" />
        </div>
      </div>
    );
  }

  if (docs.length === 0) {
    location.href = "/dashboard/onboarding";
    return null;
  }

  return (
    <div className="">
      <div className="py-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Documentations</h1>
          <p className="text-muted-foreground">
            Add a new document to get started.
          </p>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            if (!startCrawling) {
              setIsOpen(open);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">New docs</Button>
          </DialogTrigger>
          <DialogContent className="rounded-b-none sm:max-w-full w-full h-full">
            {!startCrawling && (
              <div className="text-center">
                <Brand noLink={true} />
                <h1 className="text-xl mt-4">
                  Add a new document to get started.
                </h1>
              </div>
            )}
            <AddDocs
              setStartCrawling={setStartCrawling}
              setIsOpen={setIsOpen}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className=" text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground">URL</TableHead>
              <TableHead className=" text-muted-foreground">Pages</TableHead>
              <TableHead className="text-right text-muted-foreground">
                Created At
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map(
              (doc: {
                _id: string;
                url: string;
                name: string;
                createdAt: number;
                pages?: { url: string }[];
              }) => (
                <Dialog>
                  <DialogTrigger asChild>
                    <TableRow key={doc._id} className="cursor-pointer">
                      <TableCell className="font-medium py-4">
                        {doc.name}
                      </TableCell>
                      <TableCell className="py-4">{doc.url}</TableCell>
                      <TableCell className="py-4">
                        {doc.pages?.length || 0} pages
                      </TableCell>
                      <TableCell className="text-right py-4">
                        {moment(doc.createdAt).format("MMM Do YY")}
                      </TableCell>
                    </TableRow>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Docs details</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-1 items-center gap-2 text-sm text-muted-foreground max-w-[200px]">
                          <Tag className="size-3.5 text-muted-foreground" />{" "}
                          NAME:
                        </div>
                        <p>{doc.name}</p>
                      </div>
                      <div className="flex items-center gap-6 text-muted-foreground">
                        <div className="flex flex-1 items-center gap-2 max-w-[200px]">
                          <Globe className="size-3.5 text-muted-foreground" />{" "}
                          URL:
                        </div>
                        <a
                          href={doc.url}
                          className="text-sm text-foreground hover:text-blue-600"
                          target="_blank"
                        >
                          {doc.url}
                        </a>
                      </div>
                      <div className="flex items-center gap-6 text-muted-foreground">
                        <div className="flex flex-1 items-center gap-2 max-w-[200px]">
                          <Calendar className="size-3.5 text-muted-foreground" />{" "}
                          Date Created:
                        </div>
                        <p className="text-sm text-foreground">
                          {moment(doc.createdAt).format("MMM Do YY")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="relative space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Network className="h-4 w-4" />
                          documentation
                        </div>
                        <Card className="border border-border bg-muted/20 p-4 shadow-none">
                          <button className="mb-3 flex w-full items-center gap-2 text-left transition-colors outline-none hover:opacity-80">
                            <span className="text-sm font-medium text-foreground">
                              Pages
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {doc.pages?.length || 0}
                            </span>
                          </button>
                          {isCrawlingExpanded && (
                            <div className="space-y-2">
                              {doc.pages?.map(({ url }, index) => (
                                <motion.div
                                  initial={{ translateY: 10, opacity: 0 }}
                                  animate={{ translateY: 0, opacity: 1 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: index * 0.1,
                                  }}
                                  key={index}
                                  className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent"
                                >
                                  <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                    <div className="h-2 w-2 rounded-sm bg-primary" />
                                  </div>
                                  <span className="flex-1 truncate text-sm text-foreground">
                                    {url}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
