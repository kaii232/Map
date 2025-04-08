"use client";

import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
import Spinner from "./ui/spinner";

export default function SignOut() {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => {
          setLoggingOut(true);
        },
        onResponse: () => {
          setLoggingOut(false);
        },
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };
  return (
    <Button onClick={handleLogOut} variant="outline">
      {loggingOut ? (
        <Spinner className="size-4" />
      ) : (
        <LogOut className="size-4" />
      )}
      Logout
    </Button>
  );
}
