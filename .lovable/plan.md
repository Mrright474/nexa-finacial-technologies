## Goal
Link NEXA to the external **Legacy Verse** Web3 NFT marketplace (https://id-preview--9ad1b507-e0ce-4091-8ccd-5cf234a28e97.lovable.app/mine) so users can buy NFTs with NXA. All links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) and use the label **"Buy NFTs with NXA"**.

## Single source of truth
Add `src/config/externalLinks.ts` exporting `LEGACY_VERSE_URL` and `LEGACY_VERSE_LABEL = "Buy NFTs with NXA"` so the URL/label is changed in one place.

## Placements

### 1. Landing page — nav + hero CTA
- `src/components/layout/Navbar.tsx` (landing branch): add a new link entry `{ href: LEGACY_VERSE_URL, label: 'Buy NFTs with NXA', external: true }` rendered as an `<a target="_blank" rel="noopener noreferrer">` in both desktop nav and mobile menu, with a tiny external-link icon (`ExternalLink` from lucide).
- `src/components/landing/Hero.tsx`: add a secondary outline button next to the existing primary CTA: "Buy NFTs with NXA" with `Sparkles`/`Gem` icon, opens external link in new tab.

### 2. Dashboard navbar
- Same `Navbar.tsx` (dashboard branch): add a "Buy NFTs with NXA" `<Button variant="ghost">` (with `Gem` icon) before the Admin/Bell area on desktop, and a matching row in the mobile dashboard menu. External link, new tab.

### 3. Quick Actions tile
- `src/components/dashboard/QuickActions.tsx`: add a new tile `{ icon: Gem, label: 'NFTs', gradient: 'from-fuchsia-500 to-violet-500', external: true, href: LEGACY_VERSE_URL }`. Extend the renderer so external tiles render as `<a>` (new tab) instead of `navigate(path)`. Tooltip/aria-label uses the full "Buy NFTs with NXA" string.

### 4. About NXA page banner
- `src/pages/AboutNxa.tsx`: add a prominent glass-card banner ("Use NXA to buy NFTs on Legacy Verse") with short copy + "Buy NFTs with NXA" gradient button (external, new tab). Place near the top of the page content for visibility.

## Design notes
- Keep all styling within existing tokens (`glass-card`, `variant="gradient"`, lucide icons). No hardcoded colors.
- Use a consistent icon — `Gem` from lucide — across all four placements so users recognize the Legacy Verse entry point.
- Add `aria-label="Buy NFTs with NXA on Legacy Verse (opens in new tab)"` for accessibility.

## Out of scope
- No deep auth/SSO handoff to Legacy Verse — it's a plain outbound link for now.
- No NFT data fetching or in-app preview — that would require a Legacy Verse API.
