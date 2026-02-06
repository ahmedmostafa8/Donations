# 🎨 Dark Glassmorphism UI Prompt

Use this prompt when you want to create any page/app with this design style.

---

## The Prompt

```
Create a [COMPONENT/PAGE NAME] using the "Dark Glassmorphism with Aurora Orbs" design style:

## Core Style:
- Background: Very dark (#0a0a0f) with subtle dot pattern overlay
- Animated gradient orbs in the background (2-3 large blurred circles with pulse animation)
- Glassmorphism cards with gradient borders (white/10 borders, #12121a fill)
- Warm color palette: amber/orange/rose for primary actions, violet/purple/fuchsia for secondary
- All buttons and accents use gradient fills (e.g., from-amber-500 via-orange-500 to-rose-500)

## Visual Effects:
- Animated pulsing background orbs with staggered delays
- Shine/shimmer effect on card hover
- Glow shadows on buttons (shadow-lg shadow-amber-500/25)
- Smooth transitions (duration-300 to duration-500)
- Scale effect on button press (active:scale-[0.98])
- Ring effect on input focus (ring-2 ring-amber-500/50)

## Typography:
- Bold/black font weights for headings
- White text for headings, gray-400/500 for body, gray-600/700 for muted
- Gradient text for accent headings (bg-clip-text text-transparent)

## Mobile-First:
- Use 100dvh (dynamic viewport height) - no scroll on single-screen pages
- Responsive spacing: p-4 sm:p-6, text-xl sm:text-4xl
- Compact on mobile, spacious on desktop

## RTL Support:
- Use dir="rtl" for Arabic content
- Use text-right for inputs
- Icons like arrows work correctly with RTL

## Footer:
صُنع بكل حب بواسطة أحمد مصطفى ❤️
```

---

## Quick Reference

### Background Structure
```
Container: min-h-[100dvh] bg-[#0a0a0f] overflow-hidden
Orb 1 (top-right): from-amber-500/30 via-orange-500/20 blur-3xl animate-pulse
Orb 2 (bottom-left): from-violet-500/30 via-purple-500/20 blur-3xl animate-pulse delay-1s
Dot overlay: radial-gradient(circle, white 1px, transparent 1px) opacity-[0.03]
```

### Card Structure
```
Border: bg-gradient-to-br from-white/10 to-white/5 p-[1px]
Fill: bg-[#12121a] rounded-[23px]
```

### Gradients
```
Warm: from-amber-500 via-orange-500 to-rose-500
Cool: from-violet-500 via-purple-500 to-fuchsia-500
```

---

## Example Usage

> "Create a settings page using Dark Glassmorphism with Aurora Orbs style. Include a glass card with user preferences form, warm gradient save button, and back navigation."

> "Build a signup form with Dark Glassmorphism style - dark background, animated orbs, glass card, gradient submit button, RTL Arabic support, mobile-first."

---

**Style Name:** Dark Glassmorphism with Aurora Orbs  
**Tech Stack:** Tailwind CSS, React/Next.js, lucide-react icons
