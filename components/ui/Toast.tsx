"use client";

import { useEffect, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  const Toast = message ? (
    <div className="fixed right-4 top-4 z-50 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
      {message}
    </div>
  ) : null;

  return {
    Toast,
    notify: (msg: string) => setMessage(msg),
  } as const;
}
