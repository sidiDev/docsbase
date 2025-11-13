import { createFileRoute, useNavigate } from "@tanstack/react-router";
import Brand from "@/components/Brand";
import AddDocs from "@/components/AddDocs";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

export const Route = createFileRoute("/_authed/dashboard/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const [startCrawling, setStartCrawling] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();

  // Check if user has any completed docs
  const userHasDocs = useQuery(
    api.docs.hasDocs,
    user?.id ? { externalId: user.id } : "skip"
  );

  // Redirect to dashboard if user has docs
  useEffect(() => {
    if (userHasDocs === true) {
      navigate({ to: "/dashboard" });
    }
  }, [userHasDocs, navigate]);

  // Don't render anything while checking or if user has docs
  if (userHasDocs !== false) {
    return null;
  }

  // Only show onboarding if user has NO docs
  return (
    <div className="p-4 h-screen flex flex-col justify-between">
      {!startCrawling && (
        <div className="text-center">
          <Brand noLink={true} />
          <h1 className="text-xl mt-4">Welcome! Let's get you set up.</h1>
        </div>
      )}
      <AddDocs setStartCrawling={setStartCrawling} />
    </div>
  );
}
