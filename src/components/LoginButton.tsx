import { Button } from "./ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";

/**
 * Render a compact login/dashboard button that links to the dashboard when a user is signed in or opens a sign-in modal when not.
 *
 * @param name - Button label text (defaults to "Login")
 * @param width - Button width in pixels (defaults to 70)
 * @param userId - Current user identifier; when present the button navigates to `/dashboard`, when `null` it triggers the sign-in modal
 * @returns The rendered button element: a dashboard-link button if `userId` is present, otherwise a SignInButton-wrapped button that opens the sign-in modal
 */
export default function LoginButton({
  name = "Login",
  width = 70,
  userId,
}: {
  name: string;
  width?: number;
  userId: string | null;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <>
      {userId ? (
        <Button asChild style={{ width }} className="rounded-full">
          <Link to="/dashboard">{name}</Link>
        </Button>
      ) : (
        <SignInButton
          mode="modal"
          forceRedirectUrl={"/dashboard"}
          signUpFallbackRedirectUrl={"/dashboard"}
          fallbackRedirectUrl={"/dashboard"}
        >
          <Button style={{ width }} className="rounded-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : name}
          </Button>
        </SignInButton>
      )}
    </>
  );
}