"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ onError }: { onError?: (msg: string) => void }) {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        await googleLogin(response.credential);
        router.push("/");
      } catch (err: unknown) {
        onError?.(err instanceof Error ? err.message : "Google sign-in failed");
      }
    },
    [googleLogin, router, onError]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 400,
        text: "continue_with",
        shape: "pill",
      });
    };

    if (window.google) {
      renderButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = renderButton;
      document.head.appendChild(script);
    }
  }, [handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full flex justify-center">
      <div ref={buttonRef} className="w-full [&>div]:!w-full" />
    </div>
  );
}
