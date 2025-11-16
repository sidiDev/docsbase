import { Sparkles, Link2, Network, Layers, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { motion } from "motion/react";
import { Spinner } from "@/components/ui/spinner";

const crawledUrls = [
  "https://react.dev/learn",
  "https://react.dev/reference/react",
  "https://react.dev/reference/react-dom",
  "https://nextjs.org/docs/getting-started",
  "https://nextjs.org/docs/app/building-your-application",
  "https://tailwindcss.com/docs/installation",
];

function StepLoader({
  step,
  currentStep,
  isLoading,
}: {
  step: number;
  currentStep: number;
  isLoading: boolean;
}) {
  if (step == currentStep && isLoading) {
    return (
      <div className="absolute -left-6 top-1 size-3.5 rounded-full bg-white dark:bg-accent">
        <Spinner className="size-3.5" />
      </div>
    );
  }
  return (
    <div className="absolute -left-6 top-1 size-3.5 rounded-full border-2 border-background bg-primary" />
  );
}

export default function DocProgress({
  step,
  isLoading,
  documents,
}: {
  step: number;
  isLoading: boolean;
  documents: Array<{
    url: string;
  }>;
}) {
  const [isCrawlingExpanded, setIsCrawlingExpanded] = useState(true);

  return (
    step > 0 && (
      <div className="mx-auto space-y-6">
        {/* Header Card */}
        <motion.div
          initial={{
            translateY: 50,
          }}
          animate={{
            translateY: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="flex items-start gap-3"
        >
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div className="flex-1">
            <h1 className="text-balance font-semibold tracking-tight text-foreground">
              Documentation Ingestion in Progress
            </h1>
            <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
              Your documentation is being processed. Here are the steps being
              taken to crawl and index the content.
            </p>
          </div>
        </motion.div>

        {/* Steps Section */}
        <div className="space-y-4">
          <div className="relative space-y-6 pl-6">
            {/* Vertical Line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 2, delay: 0.5 },
              }}
              className="absolute left-[7px] top-2 h-[calc(100%-2rem)] w-px bg-border"
            />

            {/* Step 1: Checking URL Availability */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 2, delay: 0.5 },
              }}
              className="relative space-y-3"
            >
              {/* <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" /> */}
              <StepLoader step={1} currentStep={step} isLoading={isLoading} />
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Link2 className="h-4 w-4" />
                Checking URL availability
              </div>
              <Card className="border border-border bg-muted/20 p-4 shadow-none">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Verifying that the documentation site is accessible and
                  responsive before starting the crawl process.
                </p>
              </Card>
            </motion.div>

            {/* Step 2: Crawling */}
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 2 },
                }}
                className="relative space-y-3"
              >
                <StepLoader step={2} currentStep={step} isLoading={isLoading} />
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Network className="h-4 w-4" />
                  Crawling documentation
                </div>
                <Card className="border border-border bg-muted/20 p-4 shadow-none">
                  <button
                    onClick={() => setIsCrawlingExpanded(!isCrawlingExpanded)}
                    className="mb-3 flex w-full items-center gap-2 text-left transition-colors hover:opacity-80"
                  >
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isCrawlingExpanded ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      Pages discovered
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {documents.length}
                    </span>
                  </button>
                  {isCrawlingExpanded && (
                    <div className="space-y-2 max-h-[200px] max-w-full overflow-y-auto">
                      {documents.map(({ url }, index) => (
                        <motion.div
                          initial={{ translateY: 10 }}
                          animate={{ translateY: 0 }}
                          transition={{ duration: 0.2 }}
                          key={index}
                          className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                            <div className="h-2 w-2 rounded-sm bg-primary" />
                          </div>
                          <span className="flex-1 overflow-hidden text-sm text-foreground">
                            {url}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Step 3: Finished */}
            {step >= 3 && (
              <div className="relative">
                <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Layers className="h-4 w-4" />
                  Finished
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );
}
