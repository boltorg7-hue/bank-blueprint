import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

/** Available in all three independent site headers. */
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div role="group" aria-label={language === "fr" ? "Choisir la langue" : "Choose language"} className="flex shrink-0 items-center rounded-md border border-border p-0.5">
      {(["fr", "en"] as const).map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant="ghost"
          lang={code}
          aria-label={code === "fr" ? "Français" : "English"}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className={`touch-target min-w-10 px-2 text-xs font-semibold ${language === code ? "bg-brand-muted text-brand" : "text-muted-foreground"}`}
        >
          {code === "fr" ? "FR" : "EN"}
        </Button>
      ))}
    </div>
  );
}