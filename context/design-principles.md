# Design Principles (Indie)

Pragmatic checklist. Ship fast, look professional, don't obsess.

## Core Philosophy
- Working > Pretty
- Shipped > Perfect
- User can accomplish goal > Design awards

## Quick Checks (Every Change)

### Does It Work?
- [ ] Primary action functions
- [ ] No console errors
- [ ] Links go somewhere
- [ ] Forms submit

### Does It Look Broken?
- [ ] No overlapping text
- [ ] Images load/have fallbacks
- [ ] Reasonable spacing (not cramped/floating)
- [ ] Text readable (contrast, size)

### Is It Usable?
- [ ] User knows what to do
- [ ] Buttons look clickable
- [ ] Links look like links
- [ ] Interactive elements have hover states

## Higher Bar (Money Features Only)

### Visual Polish
- [ ] Consistent spacing
- [ ] Aligned elements
- [ ] Intentional color usage
- [ ] Loading states for async

### UX Polish
- [ ] Clear error messages
- [ ] Success confirmation
- [ ] Graceful failure
- [ ] Mobile works

## Common Gotchas
- Text contrast on images (add overlay)
- Touch targets too small on mobile (44px min)
- Missing focus states (keyboard users)
- No loading indicator on slow actions
- Error messages that don't help

## When to Stop Polishing
- It works
- It's not ugly
- Users can figure it out
- Ship it. Get feedback. Iterate.
