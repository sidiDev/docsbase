import { Button } from "./ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSignIn } from "@clerk/clerk-react";

export default function LoginButton({
  name = "Login",
  width = 70,
}: {
  name: string;
  width?: number;
}) {
  const [loading, setLoading] = useState(false);
  const { signIn } = useSignIn();

  const handleLogin = async () => {
    if (!signIn) return;

    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      setLoading(false);
      console.error("Login error:", err);
    }
  };

  return (
    <Button onClick={handleLogin} style={{ width }} className="rounded-full">
      {loading ? <Loader2 className="size-4 animate-spin" /> : name}
    </Button>
  );
}
