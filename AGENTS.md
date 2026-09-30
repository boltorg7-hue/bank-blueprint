<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

The public homepage follows a photo-first editorial presentation while the authenticated app retains its separate task-oriented shell; this keeps discovery distinct from banking actions.

The FR/EN interface choice lives in the shared LanguageProvider and each shell exposes the same LanguageSwitch; this preserves language across navigation without altering banking data or operations.
The first language choice follows the browser's preferred supported locale (FR/EN), while a manual choice takes precedence via local storage; the header control is shared across public, customer, and admin shells.
Mobile presentation follows a restrained “modern organic luxury” direction: immersive local photography publicly, compact native surfaces and thumb-reachable controls in banking shells; this preserves institutional trust without changing financial behavior.
The onboarding AI receives fully localized FR/EN requirements and customer progress through a request-scoped Gateway client; this prevents mixed-language answers and keeps correlation isolated.
The admin account-opening register joins profiles, identity verification and received-document metadata behind `customers.read`; this keeps KYC tracking server-authorized and read-only.
Customer onboarding decisions use a two-person workflow: `kyc.review` recommends, a distinct `kyc.approve` actor decides, and only the privileged server opens the pending USD account; approval notes are disclosed only to KYC-authorized staff.
Recoverable admin conflicts return typed action results instead of thrown server errors; this keeps stale or duplicate actions inside the dialog without blanking the admin screen.
