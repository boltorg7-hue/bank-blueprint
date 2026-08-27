import { Accordion } from "@/components/ui/accordion";
import { FaqItem } from "@/components/marketing/FaqItem";
import { cn } from "@/lib/utils";

/** Accessible FAQ block (§44, §68). */
export function FaqSection({
  items,
  idPrefix = "faq",
  className,
}: {
  items: { question: string; answer: string }[];
  idPrefix?: string;
  className?: string;
}) {
  return (
    <Accordion type="single" collapsible className={cn("w-full", className)}>
      {items.map((item, index) => (
        <FaqItem
          key={item.question}
          value={`${idPrefix}-${index}`}
          question={item.question}
          answer={item.answer}
        />
      ))}
    </Accordion>
  );
}
