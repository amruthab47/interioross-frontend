# InteriorOS Frontend Rules

## Project Context
This is a React full stack project for InteriorOS, an interior design SaaS platform.

IMPORTANT:
- Use only real data from a real database
- UI must look like a professional SaaS product

---

## Tech Stack
- React (Vite)
- Tailwind CSS
- React Router v6
- Lucide React (icons)
- Recharts (charts)

---

## Folder Rules
- Components go in: /src/components
- Pages go in: /src/pages
- Do NOT hardcode data inside components or pages

---

## Design System 

### Colors
- Dark Navy: #0F2340 for Sidebar background, main headings, table headers
- Blue: #1B4F8A for Subheadings, active navigation items, and primary buttons 
- Mid Blue: #2E6DA4 for Links, secondary buttons, border accents
- Light Blue: #D6E8F7 for Table row hover, callout boxes, card backgrounds
- Accent Orange: #E07B20 for Highlights, badges, critical status indicators, CTAs
- White: #FFFFFF for Main content background, card backgrounds
- Off White: #F7F9FC for Alternate table rows, page background
- Body Gray: #333333 for All body text
- Muted Gray: #777777 for Secondary text, timestamps, labels

Do not use any other colors.

---

### Typography
- Headings (page titles and section headings only): Sora
- Body, labels, table content: DM Sans
- Base font size: 14px
- Strictly do not use Arial, Inter, Roboto, or system fonts anywhere in the UI



---

## Layout Rules
- Sidebar: fixed, 240px width, dark navy background
- Header: fixed, 60px height, white
- Cards: white background, rounded, subtle shadow
- Tables: clean, alternating rows

---

## Icons
-	Use Lucide React icon library — it is already available in React artifacts
-	Sidebar icons: 20px size, white color
-	In-content icons: 16px size, matching text color
-	Do not use emoji as icons anywhere in the UI

---

## Responsiveness
- The primary target is desktop browser (1280px and above). Mobile responsiveness is not required.

---

## Component Rules
- Components must be reusable
- Use props (no hardcoded values)
- Keep code clean and minimal
- Use Tailwind CSS only

---

## UI Guidelines

- Focus on spacing and alignment

---


---



## When Generating Code
- Only generate code for the requested file
- Do not modify unrelated files
- Keep output clean
- No explanations unless asked

---

## Screenshot-Based UI Instructions

When a design screenshot is provided:

- Recreate the structure, layout, and hierarchy from the screenshot
- Strictly follow the InteriorOS design system for colors, typography, and spacing
- Do NOT copy exact styles if they conflict with project rules
- Maintain consistency with existing components and layouts
- Use reusable components wherever possible
- Use Tailwind CSS only
- Make sure to re-create the design as closest to the screenshot as possible while as following the design rules mentioned very strictly. Compare your final output with the screenshot and make sure they match as closely as possible. Keep iterating and comparing design until user is satisfied.

The final output must look consistent with the InteriorOS product, not like a separate design.

---

## Goal
Build a complete, professional website ready for client demo.