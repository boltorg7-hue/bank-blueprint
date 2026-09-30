import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteAdminCustomer } from "@/features/admin/hooks/useAdmin";

export function InviteCustomerDialog() {
  const { language } = useLanguage();
  const en = language === "en";
  const mutation = useInviteAdminCustomer();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await mutation.mutateAsync({ email, firstName, lastName });
      if (!result.ok) {
        const messages = {
          INVITATION_ALREADY_REGISTERED: en ? "This address is already registered." : "Cette adresse est déjà inscrite.",
          INVITATION_RATE_LIMITED: en ? "Too many invitations were sent. Try again later." : "Trop d’invitations ont été envoyées. Réessayez plus tard.",
          INVITATION_UNAVAILABLE: en ? "The invitation service is temporarily unavailable. Try again later." : "Le service d’invitation est temporairement indisponible. Réessayez plus tard.",
        } as const;
        toast.error(messages[result.code]);
        return;
      }
      toast.success(en ? "Invitation sent securely." : "Invitation envoyée en toute sécurité.");
      setOpen(false); setEmail(""); setFirstName(""); setLastName("");
    } catch (error) {
      toast.error(en ? "The invitation could not be sent. Try again later." : "L’invitation n’a pas pu être envoyée. Réessayez plus tard.");
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button className="w-full sm:w-auto"><UserPlus className="size-4" />{en ? "Invite a customer" : "Inviter un client"}</Button></DialogTrigger>
    <DialogContent className="w-[calc(100%-2rem)] rounded-md sm:max-w-lg">
      <form onSubmit={submit} className="space-y-5">
        <DialogHeader><DialogTitle>{en ? "Invite a new customer" : "Inviter un nouveau client"}</DialogTitle><DialogDescription>{en ? "The customer will receive a secure link to set a password and complete the application." : "Le client recevra un lien sécurisé pour définir son mot de passe et compléter son dossier."}</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="invite-first-name">{en ? "First name" : "Prénom"}</Label><Input id="invite-first-name" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required minLength={2} /></div><div className="space-y-2"><Label htmlFor="invite-last-name">{en ? "Last name" : "Nom"}</Label><Input id="invite-last-name" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required minLength={2} /></div></div>
        <div className="space-y-2"><Label htmlFor="invite-email">{en ? "Email address" : "Adresse e-mail"}</Label><Input id="invite-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>{en ? "Cancel" : "Annuler"}</Button><Button type="submit" loading={mutation.isPending}>{en ? "Send invitation" : "Envoyer l’invitation"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}