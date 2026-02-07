"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ShieldX, LogIn, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="group transition-all duration-200 hover:bg-primary/10"
        >
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>
        </Button>

        <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Akses Ditolak</CardTitle>
            <CardDescription className="text-muted-foreground">
              Anda tidak memiliki izin untuk mengakses halaman ini. Silakan login
              terlebih dahulu.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Button
              asChild
              className="w-full font-semibold transition-all duration-200 hover:shadow-md"
            >
              <Link href="/login" className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Masuk / Login
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full group transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
                Kembali ke Beranda
              </Link>
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <p className="text-xs text-muted-foreground text-center">
              Butuh bantuan?{" "}
              <a
  href="https://t.me/rafliramadhaniii?text=Halo%20Admin,%20saya%20memiliki%20kendala%20pada%20aplikasi%20GoTEK.%20Mohon%20bantuannya.%20Terima%20kasih."
  className="text-primary hover:underline font-medium"
  target="_blank"
  rel="noopener noreferrer"
>
  Telegram Support
</a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
