import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/** FAQ entry — use inside <Accordion type="single" collapsible>. */
export function FaqItem({
  value,
  question,
  answer,
}: {
  value: string;
  question: string;
  answer: string;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-label text-left">{question}</AccordionTrigger>
      <AccordionContent className="text-body-sm text-muted-foreground">{answer}</AccordionContent>
    </AccordionItem>
  );
}
