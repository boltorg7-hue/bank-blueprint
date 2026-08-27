import { Link } from "@tanstack/react-router";
import { LifeBuoy, Lock, LogOut, Sliders, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { useSignOut } from "@/features/auth/hooks/useSessionUser";
import type { CustomerSummary } from "@/features/customer-shell/hooks/useCustomerSummary";
import { lifecycleStatusTone } from "@/features/customer-shell/lib/status-tone";
import { LIFECYCLE_LABELS } from "@/types/customer-lifecycle";

const MENU_ITEMS = [
  { label: "Mon profil", to: "/app/profile", icon: UserRound },
  { label: "Sécurité", to: "/app/security", icon: Lock },
  { label: "Préférences", to: "/app/settings", icon: Sliders },
  { label: "Aide", to: "/help", icon: LifeBuoy },
] as const;

/** Customer account menu (§18 – §20). Sign-out terminates the real session. */
export function CustomerMenu({ summary }: { summary: CustomerSummary | null }) {
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="touch-target rounded-full"
          aria-label="Menu client"
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium">
              {summary?.initials ?? "··"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-1.5">
          <span className="block truncate text-sm font-medium">
            {summary?.displayName ?? "Client"}
          </span>
          {summary ? (
            <StatusBadge
              tone={lifecycleStatusTone(summary.lifecycleState)}
              label={LIFECYCLE_LABELS[summary.lifecycleState]}
            />
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.label} asChild>
              <Link to={item.to}>
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="size-4" aria-hidden="true" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
