import { Button } from "./ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import authClient from "../lib/auth-client";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export default function LoginButton({
  name = "Login",
  width = 70,
}: {
  name: string;
  width?: number;
}) {
  const [loading, setLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      await authClient.signIn.social(
        {
          provider: "google",
          callbackURL: "/dashboard",
        },
        {
          onError: ({ error }) => {
            toast.error(
              error.message || `An error occurred during Google sign-in.`
            );
          },
        }
      ),
  });
  const handleLogin = async () => {
    setLoading(true);
    await mutation
      .mutateAsync()
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message || `An error occurred during Google sign-in.`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Button onClick={handleLogin} style={{ width }} className="rounded-full">
      {loading ? <Loader2 className="size-4 animate-spin" /> : name}
    </Button>
  );
}
