---
name: dashboard-ui
description: UI standards specifically for the backend/client (Dashboard). Enforces TanStack Table implementation and centralized Button design.
---

# dashboard-ui - Dashboard UI Standards

These standards ensure a consistent and professional experience across the admin dashboard.

## 1. Table Standard (TanStack Table)
All data lists must use `react-tanstack/table` combined with the centralized Shadcn UI `Table` components.

### Core Features
- **Search**: Top-left search bar using a global filter or column filter.
- **Filtering**: View toggles (e.g., Table vs. Grid) and status filters.
- **Pagination**: Manual pagination with "Showing X of Y" results and Previous/Next buttons.
- **Responsiveness**: Always wrap tables in a container with `overflow-x-auto`.
- **Skeleton Loading**: Use opacity or skeletons while data is fetching.

### Component Structure
```tsx
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// ... TanStack table initialization ...

<div className="rounded-md border overflow-x-auto">
  <Table>
    <TableHeader>
      {table.getHeaderGroups().map((hg) => (
        <TableRow key={hg.id}>
           {hg.headers.map((h) => <TableHead key={h.id}>...</TableHead>)}
        </TableRow>
      ))}
    </TableHeader>
    <TableBody>
      {table.getRowModel().rows.map((row) => (
        <TableRow key={row.id}>
           {row.getVisibleCells().map((c) => <TableCell key={c.id}>...</TableCell>)}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

## 2. Centralized Button Design
Always use the customized `Button` component from `@/components/ui/button`. Do not use raw `<button>` tags or inline styles for buttons.

### Guidelines
- **Primary Actions**: `variant="default"` (Blue/Primary color).
- **Secondary Actions/Export/Import**: `variant="outline"`.
- **Destructive (Delete)**: `variant="ghost" className="text-red-500"` or `variant="destructive"`.
- **Icon Buttons**: Use `size="icon"` or `size="sm"` with clear titles/tooltips.
- **Consistency**: Buttons in headers should have icons (e.g., `<Plus />`, `<Download />`).

## 3. Responsive Layout
- **Container Spacing**: Use `p-4 md:p-6` for main page containers.
- **Mobile Toolbar**: Stack search and actions vertically on mobile using `flex-col md:flex-row`.
