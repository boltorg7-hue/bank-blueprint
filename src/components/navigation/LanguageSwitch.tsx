import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Languages } from "lucide-react";

/** Available in all three independent site headers. */
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon" variant="ghost" className="touch-target shrink-0" aria-label={language === "fr" ? "Choisir la langue, français sélectionné" : "Choose language, English selected"} title={language === "fr" ? "Langue : Français" : "Language: English"}>
          <Languages className="size-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {(["fr", "en"] as const).map((code) => (
          <DropdownMenuItem key={code} lang={code} onSelect={() => setLanguage(code)} className="min-h-11 justify-between gap-4">
            <span>{code === "fr" ? "Français" : "English"}</span>
            {language === code && <Check className="size-4 text-brand" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}