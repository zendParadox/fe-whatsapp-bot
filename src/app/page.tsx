import Link from "next/link";
import { Button } from "@/components/ui/button";
// Landing Components
import { AnimatedHero } from "@/components/landing/AnimatedHero";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";

function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/50 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tighter"
        >
          <span className="bg-gradient-to-r from-ai-cyan to-ai-purple bg-clip-text text-transparent text-glow">
            GoTEK
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Fitur
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cara Kerja
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Harga
          </Link>
          <Link
            href="/guide"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Panduan
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* <ModeToggle /> */}
          <Button
            asChild
            variant="ghost"
            className="hidden sm:inline-flex hover:bg-accent hover:text-accent-foreground"
          >
            <Link href="/login">Masuk</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="sm:size-default bg-gradient-to-r from-ai-cyan to-ai-purple hover:opacity-90 transition-opacity border-0 shadow-[0_0_20px_rgba(var(--color-ai-cyan),0.3)] text-black font-bold"
          >
            <Link href="/register">Daftar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-white/5 bg-background py-12 relative overflow-hidden">
      {/* Footer subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-ai-purple/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mb-8 flex justify-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-ai-cyan to-ai-purple bg-clip-text text-transparent">
            GoTEK
          </span>
        </div>
        <p className="text-muted-foreground mb-4">
          Kelola keuangan dengan cara masa depan. Didukung oleh AI.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm text-muted-foreground mb-4">
          <Link
            href="/guide"
            className="hover:text-ai-cyan transition-colors font-medium"
          >
            Panduan Lengkap
          </Link>
          <span className="hidden sm:inline text-white/20">|</span>
          <Link
            href="/feedback"
            className="hover:text-ai-purple transition-colors font-medium"
          >
            Beri Masukan
          </Link>
          <span className="hidden sm:inline text-white/20">|</span>
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privasi
          </Link>
          <span className="hidden sm:inline text-white/20">|</span>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Syarat
          </Link>
          <span className="hidden sm:inline text-white/20">|</span>
          <a
            href="https://t.me/rafliramadhaniii"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ai-cyan transition-colors font-medium"
          >
            Telegram Support
          </a>
        </div>
        <p className="text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} GoTEK. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="dark bg-background text-foreground min-h-screen font-sans selection:bg-ai-cyan/30 selection:text-ai-cyan">
      <AppHeader />

      <main className="flex-grow pt-16 relative overflow-hidden">
        {/* Animated Particle/Grid Background Base */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Deep ambient glows */}
        <div className="fixed inset-0 -z-10 pointer-events-none mix-blend-screen">
          <div
            className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-ai-purple/10 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: "7s" }}
          />
          <div
            className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-ai-cyan/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDuration: "5s" }}
          />
          <div
            className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-ai-pink/10 rounded-full blur-[150px] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
        </div>

        <AnimatedHero />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
      </main>

      <AppFooter />
    </div>
  );
}
