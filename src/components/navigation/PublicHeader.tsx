import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { BrandMark } from "@/components/navigation/BrandMark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PUBLIC_NAV } from "@/config/navigation";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {PUBLIC_NAV.map((item) =>
        item.upcoming ? (
          <span
            key={item.label}
            className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground"
          >
            {item.label}
            <span className="rounded-full border border-border px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wide">
              Bientôt
            </span>
          </span>
        ) : (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground font-medium" }}
            className="px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="safe-pt sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <BrandMark />

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 md:flex">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="touch-target" />
          <Button asChild variant="ghost" size="sm" className="hidden touch-target sm:inline-flex">
            <Link to="/app/dashboard">Espace client</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="touch-target md:hidden">
                <Menu className="size-5" aria-hidden="true" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="safe-pt safe-pb w-[85vw] max-w-xs">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigation mobile" className="mt-4 flex flex-col gap-1 px-4">
                <NavLinks onNavigate={() => setOpen(false)} />
                <Button asChild className="mt-4 touch-target">
                  <Link to="/app/dashboard" onClick={() => setOpen(false)}>
                    Espace client
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
