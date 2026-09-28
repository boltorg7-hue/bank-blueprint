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
import { PUBLIC_CTA, PUBLIC_PRIMARY_NAV } from "@/features/public/content/site";
import { ThemeToggle } from "@/components/providers/ThemeProvider";
import { useSessionUser, useSignOut } from "@/features/auth/hooks/useSessionUser";


function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {PUBLIC_PRIMARY_NAV.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          onClick={onNavigate}
          activeProps={{ className: "text-foreground font-medium" }}
          className="text-body-sm px-1 py-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useSessionUser();
  const signOut = useSignOut();

  return (
    <header className="safe-pt sticky top-0 z-40 border-b border-border bg-surface/95 shadow-[var(--shadow-subtle)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <BrandMark />

        <nav aria-label="Navigation principale" className="hidden items-center gap-5 lg:flex">
          <NavLinks />
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle className="touch-target" />
          {loading ? null : user ? (
            <>
              <Button asChild size="sm" className="hidden touch-target sm:inline-flex">
                <Link to="/app/dashboard">Mon espace</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden touch-target sm:inline-flex"
                onClick={() => void signOut()}
              >
                Se déconnecter
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden touch-target sm:inline-flex"
              >
                <Link to={PUBLIC_CTA.secondaryTo} data-analytics-event="sign_in_clicked">
                  {PUBLIC_CTA.secondary}
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden touch-target lg:inline-flex">
                <Link to={PUBLIC_CTA.primaryTo} data-analytics-event="open_account_clicked">
                  {PUBLIC_CTA.primary}
                </Link>
              </Button>
            </>
          )}


          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="touch-target lg:hidden" aria-label="Ouvrir le menu">
                <Menu className="size-5" aria-hidden="true" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="safe-pt safe-pb w-[90vw] max-w-sm overflow-y-auto bg-surface">
              <SheetHeader>
                <SheetTitle className="text-heading-md text-foreground">RFC Royal FINANCE Bank</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigation mobile" className="mt-6 flex flex-col gap-1 px-4 pb-6 [&_a]:min-h-12 [&_a]:rounded-md [&_a]:px-3 [&_a]:py-3 [&_a]:text-base [&_a]:hover:bg-surface-sunken">
                <NavLinks onNavigate={() => setOpen(false)} />
                <Link to="/contact" onClick={() => setOpen(false)} className="text-muted-foreground transition-colors">Contact</Link>
                {user ? (
                  <>
                    <Button asChild className="mt-4 touch-target">
                      <Link to="/app/dashboard" onClick={() => setOpen(false)}>
                        Mon espace
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="touch-target"
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                      }}
                    >
                      Se déconnecter
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="mt-4 touch-target">
                      <Link
                        to={PUBLIC_CTA.primaryTo}
                        onClick={() => setOpen(false)}
                        data-analytics-event="open_account_clicked"
                      >
                        {PUBLIC_CTA.primary}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="touch-target">
                      <Link to={PUBLIC_CTA.secondaryTo} onClick={() => setOpen(false)}>
                        {PUBLIC_CTA.secondary}
                      </Link>
                    </Button>
                  </>
                )}

              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
