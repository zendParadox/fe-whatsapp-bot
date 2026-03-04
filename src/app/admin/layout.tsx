import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminGuard from "@/components/admin/AdminGuard";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export const metadata = {
  title: "Admin Dashboard — GoTEK",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Admin Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <VisuallyHidden.Root>
                  <SheetTitle>Admin Menu</SheetTitle>
                  <SheetDescription>Navigation for admin panel</SheetDescription>
                </VisuallyHidden.Root>
                <AdminSidebar isMobile />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              GoTEK Admin
            </h2>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <AdminGuard>{children}</AdminGuard>
        </div>
      </main>
    </div>
  );
}
