"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.replace("/dashboard");
      });
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Akan diarahkan oleh router.replace
  }

  return <>{children}</>;
}
