# Home hero reference implementation

The homepage hero is implemented in `src/HomeHero.jsx` and `src/home-hero.css`. The reference screenshot is not embedded or cropped into the page. Headings, text, calls to action, cards, circle, orbit, tabs and search controls are rendered as React, CSS and SVG. The existing transparent worker is reused.

The construction background is a separate generated environmental asset at `public/assets/hero-construction-reference.png`. It was created with the built-in Imagegen tool, not the CLI, and is blended with CSS masks. The new photograph and existing worker are not identical to the reference's source photographs; the layout follows the supplied reference.

## Background generation prompt

Use case: photorealistic-natural. Create a standalone photographic BACKGROUND ASSET for a construction recruitment website, NOT a website screenshot, NOT a UI mockup. Landscape 3:2 image. A modern large Australian-style city construction site, high-rise concrete building skeletons with exposed floor slabs and scaffolding on the left and right, three detailed orange tower cranes across the top with diagonal lattice jibs, one big orange tracked excavator lower-right and small construction equipment and rubble at ground level, distant high-rise skyline and warm sunrise glowing through the middle-right, pale blue softly clouded sky. Camera at ground level looking into the site. Crisp, realistic architectural photography, premium warm morning light, muted concrete gray, navy shadows and vivid warm orange cranes. Detailed yet airy. Fill the image to the edges, no borders or white vignettes (these will be done in CSS), no words, no labels, no text, no logos, no icons, no cards, no person in foreground, no orange circle. This is only an environmental background visual for a coded webpage.

## Search behavior

The Job Seeker form searches the website's six existing recruitment categories by keyword and industry. Location is retained as a preference, since the project has no vacancy feed or role-specific location data. Results explicitly describe work areas rather than inventing live jobs. The Employer tab opens a contact panel linked to the existing contact page. Registration links lead to the existing worker registration form. No new backend submission behavior is introduced.

## Verification

- Browser inspection of desktop composition, 1024px tablet layout and 390px mobile layout, with no horizontal overflow at those widths.
- Brand heading color checked as `rgb(48, 73, 125)` (`#30497D`).
- Employer and Job Seeker tabs switch panels.
- Warehouse keyword plus Warehousing industry returns one matching work area.
- A nonexistent keyword shows the empty state; View all work areas restores six categories.
- Register interest navigates to the worker registration form.
- Production build and whitespace validation run before delivery.
