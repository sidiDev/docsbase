import { Button } from "./ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";

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
