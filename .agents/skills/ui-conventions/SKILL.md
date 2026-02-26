---
name: ui-conventions
description: Guidelines for frontend development in Mahbub Shop, focusing on responsive design, mobile-first approach, and modern UI/UX standards. Use this skill when building or refactoring UI components.
---

# ui-conventions - UI & Responsiveness Standards

These guidelines ensure that the Mahbub Shop ecosystem (Storefront and Dashboard) remains high-quality and functional across all device sizes.

## 1. Responsive Design Principles
- **Mobile-First Approach**: Always design and code for the smallest screen first, then add enhancements for larger screens using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).
- **Breakpoint Consistency**:
  - `Mobile`: Default (no prefix)
  - `Tablet`: `md:` (768px+)
  - `Desktop`: `lg:` (1024px+)
- **Flexible Layouts**: Use Flexbox and Grid (`flex`, `grid`, `col-span-X`) instead of fixed widths wherever possible.

## 2. Interaction Standards
- **Touch-Friendly**: Ensure buttons and links have a minimum hit target of 44x44px on mobile.
- **Hover Effects**: Only apply `:hover` styles for `lg:` breakpoints and above to avoid "sticky" hover states on touch devices.
- **Scroll Management**: Use `overflow-x-auto` for wide tables to ensure they are readable on small screens.

## 3. Visual Excellence
- **Vibrant & Dynamic**: Use gradients and subtle micro-animations (e.g., scale on hover, smooth transitions) to make the interface feel "alive."
- **Typography**: Use relative units (`rem`, `em`) for font sizes to respect user accessibility settings.
- **Spacing**: Use standard Tailwind spacing scales (`p-4`, `m-2`) to maintain visual rhythm.

## 4. Performance & Assets
- **Images**: Use `next/image` for automatic optimization and responsive sizing.
- **Icons**: Use `Lucide React` for lightweight, scalable vector icons.

## 5. File Upload Patterns
- **React Dropzone**: Use `react-dropzone` for all file upload areas to provide a consistent drag-and-drop experience.
- **Feedback**: Always show a preview for images and progress indicators for large uploads.
- **Validation**: Enforce file type and size limits on the client side before triggering the upload.
