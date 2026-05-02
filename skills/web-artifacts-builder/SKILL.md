# Web Artifacts Builder

## Context

Use this skill when the user wants to create a single-file HTML artifact containing a fully self-contained interactive web application or visualization. The artifact must work by opening the HTML file directly in a browser with zero dependencies.

**Trigger phrases:** "create an HTML artifact," "single-file web app," "self-contained HTML page," "build an interactive demo," "web artifact."

---

## Instructions

### Step 1: Initialize the Project

1. **Create a Vite project** with React + TypeScript:
   ```bash
   npm create vite@latest artifact-name -- --template react-ts
   cd artifact-name
   ```

2. **Install dependencies:**
   ```bash
   npm install tailwindcss @tailwindcss/vite lucide-react
   npm install class-variance-authority clsx tailwind-merge
   npm install -D @types/node
   ```

3. **Add shadcn/ui components** as needed (copy source files, not the CLI):
   ```
   src/
     components/
       ui/
         button.tsx
         card.tsx
         input.tsx
         dialog.tsx
         ... (only what's needed)
   ```

4. **Configure Tailwind** in `vite.config.ts`:
   ```typescript
   import tailwindcss from "@tailwindcss/vite";
   export default defineConfig({
     plugins: [react(), tailwindcss()],
   });
   ```

### Step 2: Develop Components

5. **Build the application** using React components. Follow standard React patterns:
   - Use functional components with hooks
   - Manage state with `useState`, `useReducer`, or `useRef`
   - Keep components small and focused

6. **Use Tailwind for all styling.** No external CSS files. Use utility classes directly in JSX or via `cn()` helper:
   ```typescript
   import { cn } from "@/lib/utils";
   ```

7. **Use Lucide React** for icons. Do NOT use icon fonts or SVGs from CDNs.

8. **Make it responsive.** Test at mobile (375px), tablet (768px), and desktop (1280px).

9. **Wire up interactivity.** The artifact must DO something interactive: calculations, visualizations, games, simulations, data exploration, etc.

### Step 3: Bundle into Single HTML

10. **Build for production:**
    ```bash
    npm run build
    ```

11. **Verify the dist folder** contains an `index.html` that references bundled JS/CSS.

12. **If external resources are needed**, inline them:
    - Inline small CSS into a `<style>` block
    - Inline small JS into a `<script>` block
    - For images, use base64 data URIs or generate SVG inline
    - Fonts: prefer system fonts or inline @font-face

13. **Test the artifact** by opening the HTML file directly in a browser (no server). Verify:
    - All functionality works
    - No 404 errors in console
    - Layout renders correctly
    - Interactive elements respond

14. **Optimize:**
    - Minify if needed
    - Remove unused code
    - Ensure total file size stays reasonable (< 2MB preferred)

---

## Constraints

- The final output MUST be a single HTML file that works offline when opened directly.
- NEVER use external CDNs, API calls, or network resources in the final artifact.
- NEVER use `alert()`, `prompt()`, or `confirm()`. Use inline UI for all feedback.
- NEVER use purple gradients, excessive backdrop blur, or hero sections with centered text and emojis as a design crutch.
- NEVER use uniform `rounded-3xl` on every element. Vary border radius intentionally.
- NEVER use "AI slop" aesthetics: avoid generic gradients (purple-to-blue, pink-to-orange), overly decorative dividers, or excessive whitespace without purpose.
- Design choices MUST serve the content. Every visual element should have a reason to exist.
- Use system fonts or at most 1 custom font (inlined). Do NOT load Google Fonts from CDN.
- Icons MUST come from Lucide React (bundled). No external icon services.
- All interactivity MUST work without a server. No fetch() to external URLs.
- Color palette: prefer intentional, muted palettes. High contrast for readability. Avoid rainbow defaults.
- The artifact must be immediately useful or interesting when opened. No splash screens or loading spinners for local content.

---

## Examples

### Example 1: Personal Finance Dashboard

A single HTML file containing:
- A React app with a month-by-month expense tracker
- Input form for adding transactions (category, amount, date, note)
- Donut chart showing spending by category (rendered with inline SVG)
- Summary cards: total income, total expenses, net savings
- Dark theme with a warm amber accent color on charcoal background
- Responsive layout: single column on mobile, two columns on desktop
- All data stored in React state (resets on reload, no localStorage needed)

### Example 2: Interactive Sorting Algorithm Visualizer

A single HTML file containing:
- Bar chart visualization of array values
- Buttons to select algorithm (Bubble Sort, Quick Sort, Merge Sort, Insertion Sort)
- "Generate New Array" button with random values
- Speed control slider
- Step counter and comparison counter
- Bars animate color (red for comparing, green for swapped, default neutral)
- Controls bar at the top, visualization area below
- Clean monochrome palette: dark background, teal accent for active elements
- Respects `prefers-reduced-motion` by showing final state immediately
