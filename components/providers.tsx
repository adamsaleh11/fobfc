"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is missing.");
    }
    return new ConvexReactClient(convexUrl);
  });

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
