# 🚧 TODO – Supply-Chain "View Only" Mode

## 📜 Overview
Implement a read-only experience for existing supply-chains that can be opened from the dashboard via a new route `/digital-twin/view/[id]`.  The page must
1. Fetch the chain by **id** (Edge function `getSupplyChainById()`) which is in the lib\api\supply-chain.ts file
2. Encode its canvas state (`nodes`, `edges`) into a compressed `arch` query parameter (using `compressArchData` from `lib/utils/url-compression.ts`)
3. Render a stripped-down Digital-Twin workspace:
   • **Left:** existing `AIChatPanel` (full feature set)
   • **Right:** new **Read-Only Node Inspector** – properties only, no mutation actions
4. Block all editing / persistence actions (save, delete, drag, connect, etc.)

---

## 🗂️ File / Folder Work-Plan

### 1. Dashboard Enhancements (`components/digital-twin/display/dashboard.tsx` & `…/digital-twin-card.tsx`)
- [ ] **Add view icon**
  - Import `{ Eye }` from `lucide-react` & tooltip primitives (`Tooltip`, `TooltipTrigger`, `TooltipContent`).
  - Position: absolutely **top-right** (or near delete icon) inside the card wrapper (`group` container) – use utility classes similar to current delete button.
  - Interaction:
    ```tsx
    import { useRouter } from 'next/navigation';
    const router = useRouter();
    const handleView = (e) => { e.stopPropagation(); e.preventDefault(); router.push(`/digital-twin/view/${chain.supply_chain_id}`); };
    ```
  - Accessibility: `aria-label="View supply chain"`, tooltip text "Click to view".
- [ ] Ensure existing **delete** overlay still works (z-index / hover states).

### 2. App Router – Dynamic Route
Path: `app/(main)/digital-twin/view/[id]/page.tsx`

- [ ] Create directory tree `view/[id]` under the `(main)/digital-twin` route group.
- [ ] **Component skeleton** (client component):
  1. Read `id` param via `useParams()`.
  2. Local state `{ loading, error, supplyChain }`.
  3. `useEffect` → call `getSupplyChainById(id)`
  4. On success: extract `{ nodes, edges }` → `compressArchData({ nodes, edges })` → `setArch` query param via `router.replace()` so sibling components can access it with `nuqs`.
  5. Render layout (flex) once data ready (include **Back to Dashboard** button in header):
     ```tsx
     <div className="flex h-screen">
       <div className="w-[420px] border-r">  <!-- Left -->
         <AIChatPanel simulationMode={false} ...propNodes={nodes} propEdges={edges} ... />
       </div>
       <ReadOnlyRightPanel className="flex-1" nodes={nodes} edges={edges} />
     </div>
     ```
  6. Above the canvas, reuse Layout header component; replace **Save** button with **Back** button (`router.back()` or `router.push('/digital-twin')`).
  7. Show loading skeleton & friendly error messages (reuse `DigitalTwinSkeleton`).
- [ ] Block any editing callbacks passed to `AIChatPanel` (pass noop functions).

### 3. New Right-Panel Component
`components/digital-twin/layout/view-mode/ReadOnlyRightPanel.tsx`

- [ ] Props: `{ nodes: Node[]; edges: Edge[] }`
- [ ] Internal state: `selectedNodeId`, default null; listen to `reactflow` `onNodeClick` (view-only – highlight, but don't allow drag).
- [ ] UI-only presentation of node `data`:
  - Title = node `label` / `name`
  - Key/value grid rendered by mapping through `node.data`
  - Support basic value types (string | number | boolean | object(serialize to JSON))
  - Empty state ↔ "Select a node on the canvas to inspect details"
- [ ] Consume ReactFlow's `useReactFlow` to get the instance and track selection changes.
- [ ] Styling: apply `shadow-md`, respect theme (use existing Tailwind tokens), follow shadow guideline.

### 4. Interaction Guards / Canvas Restrictions
- [ ] Inside `DigitalTwinCanvas` provide a `viewOnly` prop; when true:
  - **Keep panning & zooming enabled** (per user decision).
  - Disable node dragging (`nodesDraggable=false`), edge creation, deletion, context menus.
  - Hide toolbar actions (`SimulationToolbar`, floating save, etc.).
  - Ensure keyboard shortcuts that mutate state are disabled.
- [ ] Update canvas hooks (`useDigitalTwinManager`, etc.) to respect `viewOnly` flag without breaking edit mode.

### 5. Types & Utilities
- [ ] Create `components/digital-twin/types/supply-chain.ts` exporting `SupplyChain`, `SupplyChainNode`, `SupplyChainEdge`.
- [ ] Update `lib/api/supply-chain.ts` to export the typed response.
- [ ] Refactor dashboard `SupplyChainData` interface to reuse global type.

### 6. Tests / QA Checklist
- [ ] **Dashboard**
  - Hover shows tooltip.
  - Click eye ➜ navigates to view route (no full reload).
- [ ] **View Page**
  - Fails gracefully if ID invalid (toast + back button).
  - Loading skeleton covers entire viewport.
  - URL updated with `arch` param; refresh page keeps state.
  - Canvas non-editable (drag attempt shows `not-allowed` cursor).
  - Right panel reflects selection in real time.
- [ ] **Performance** – ensure compression ratio logged < 35% original.
- [ ] **Accessibility** – aria labels, focus states, contrast for read-only fields.

### 7. Documentation & House-Keeping
- [ ] `README.md` → Add "View Only" usage.
- [ ] Changelog entry for feature.
- [ ] Verify no new ESLint/TSC errors; run `pnpm lint && pnpm typecheck`.
- [ ] Deploy preview link for design review.

### 4b. Routing Helpers / Utils
- [ ] If `arch` param already present (i.e., page refreshed), skip recompression fetch logic.
- [ ] Implement **URL-length safeguard**: if compressed string > 1800 chars, store `{ nodes, edges }` in `sessionStorage` (`view-arch-[id]`) and append `archKey=<id>` query param instead (per decision to fallback when long URLs).
- [ ] Optionally cache fetched chain in `localStorage` for faster reload (read-only copy). Key: `view-supplyChain-[id]`.

---

## ✅ Resolved Decisions
1. **Panning & Zooming** – remain enabled.
2. **AI Chat Mutations** – chat allowed; mutation commands disabled for now (future iteration).
3. **Analytics** – no additional analytics for view events.
4. **URL Length** – implement fallback to `sessionStorage` when compressed URL exceeds safe length.
5. **Back Button** – include a Back-to-Dashboard button in the view-mode header (using existing layout styling).

---

## 🔩 Detailed Implementation Blueprint (Folder / File / Function Map)

> The checklist above captures *what* must happen.  The following blueprint drills down into *where* each unit of work lives, the new artifacts to create, and the existing code that the agent should inspect while implementing the feature.  No runtime code is included – only structure and descriptive intent.

### 📂 New / Updated Folders

1. **`app/(main)/digital-twin/view/[id]/`**
   • `page.tsx` – View-mode entry component (client).  Hosts layout, data-fetch, and URL management.<br/>
   • `loading.tsx` – Suspense fallback that reuses `DigitalTwinSkeleton`.

2. **`components/digital-twin/layout/view-mode/`**
   • `index.ts` – Barrel export for view-mode components.<br/>
   • `ReadOnlyRightPanel.tsx` – Property inspector described in task 3.<br/>
   • `ViewModeHeader.tsx` – Slim header with **Back to Dashboard** action (extract from existing layout for re-use).

3. **`types/`**
   • `supply-chain.ts` – Canonical types (`SupplyChain`, `SupplyChainNode`, `SupplyChainEdge`, …).  Shared by dashboard, API layer, and view route.

4. **`lib/api/`** (update)
   • `supply-chain.ts` – Export `getSupplyChainById` (Edge-function wrapper) and shared type exports.

5. **`lib/hooks/`**
   • `useSupplyChainView.ts` – Data-fetch + compression handling hook (`id` ➜ fetch ➜ compress ➜ manage `arch` query param).

6. **`components/digital-twin/canvas/`** (update)
   • `digital-twin-canvas.tsx` – Accepts new boolean prop `viewOnly`.

7. **`components/digital-twin/canvas/hooks/`** (updates)
   • `useDigitalTwinManager.ts` – Thread `viewOnly` down; expose `isViewOnly` in props passed to sub-components.<br/>
   • `useNodeEdgeActions.ts` – Short-circuit mutating handlers when `isViewOnly`.<br/>
   • `useInteraction.ts` – Disable drag / selection mutations when `isViewOnly`.

### 🧩 Functions / Utilities (to **implement** or **extend**)

| Function | Location | Purpose |
|----------|----------|---------|
| `getSupplyChainById(id: string)` | `lib/api/supply-chain.ts` | Fetch single supply-chain via Edge function, return typed payload. |
| `compressArchData(data)` *(exists)* | `lib/utils/url-compression.ts` | Already compresses `{ nodes, edges }` – ensure re-export for view route. |
| `decompressArchData(str)` | `lib/utils/url-compression.ts` | Counterpart used on initial load if only `arch` param provided. |
| `applyViewOnlyConstraints(instance)` | `components/digital-twin/canvas/lib/` | Helper that toggles ReactFlow options (draggable, connectable, selectable). |
| `guardMutation(fn, enabled)` | `components/digital-twin/canvas/lib/` | Higher-order util: returns noop when `enabled === false` (used by action hooks). |
| `useReadOnlyMode(viewOnly)` | `lib/hooks/useReadOnlyMode.ts` | Centralises view-only checks so UI can hide actions (toolbar, floating save, etc.). |
| `storeArchInSession(id, data)` | `lib/utils/url-compression.ts` | Handles URL-length safeguard (sessionStorage fallback). |

### 🔧 Hook Signatures To Adjust

1. `useDigitalTwinManager(params)` ➜ add `viewOnly?: boolean`.
2. All returned callback props from `useDigitalTwinManager` should respect `viewOnly` (call guarded versions).
3. `SimulationToolbar` receives `viewOnly` to hide save/validate controls.

### 🔍 Existing Files the Agent **Must Read** Before Coding

- `components/digital-twin/canvas/digital-twin-canvas.tsx`
- `components/digital-twin/canvas/hooks/useDigitalTwinManager.ts`
- `components/digital-twin/canvas/hooks/useNodeEdgeActions.ts`
- `components/digital-twin/canvas/hooks/useInteraction.ts`
- `components/digital-twin/layout/SimulationToolbar.tsx`
- `components/digital-twin/layout/left-panel/LeftPanel.tsx`
- `components/digital-twin/layout/RightPanel` (all files) – current editable inspector implementation.
- `lib/utils/url-compression.ts`
- `components/digital-twin/display/dashboard.tsx`
- `components/digital-twin/display/digital-twin-card.tsx`

### 🗒️ Recommended Implementation Sequence

1. **Types first** – ensure shared typings.
2. **Route skeleton** – scaffold files & navigation from dashboard.
3. **Data layer** – implement `getSupplyChainById` + `useSupplyChainView`.
4. **Canvas changes** – thread `viewOnly` prop, update hooks, apply constraints.
5. **UI components** – build `ReadOnlyRightPanel` & `ViewModeHeader`.
6. **Dashboard integration** – add view icon & navigation.
7. **Fallback storage & URL logic** – implement sessionStorage safeguard.
8. **Testing & QA** – run through checklist.
9. **Docs / README** – update usage notes and changelog.

> With this map in place, implementation can follow a clear path while keeping edits minimal and well-scoped.

---

## 🔍 Context – Existing Implementation Summary (April 2025 codebase scan)

Below is a high-signal summary of the **current editable implementation** for every file that this blueprint asked the agent to inspect.  Use it as authoritative reference when wiring the new _View-Only_ mode – most of the heavy-lifting logic already exists, we only need to thread the new `viewOnly` flag and disable mutators where noted.

### 1. Canvas Layer

**`components/digital-twin/canvas/digital-twin-canvas.tsx`**
* Client component that orchestrates the whole Digital-Twin workspace.
* Props: `{ initialNodes, initialEdges }` – *no* viewOnly prop yet.
* Internally calls **`useDigitalTwinManager`** to obtain state & handlers.
* Renders, top-to-bottom:
  1. `<SimulationToolbar {...simulationToolbarProps} />`
  2. Flex container with three columns:
     • `<LeftPanel {...leftPanelProps}/>` – collapsible builder / AI chat.
     • **ReactFlow** canvas – exposes `reactFlowInstance` via `ref`.
     • `<RightPanel {...rightPanelProps}/>` – node/edge inspector.
  3. `<ValidationDialog …/>` (modal for validation issues).
* Custom keyboard handling:
  • <kbd>Delete</kbd>/<kbd>Backspace</kbd> – delete selected node.
  • <kbd>Ctrl + S</kbd> – call `simulationToolbarProps.onSave()`.
* Drag-&-drop support (`onDragOver`, `onDrop`) to add nodes from palette.
* **Current mutable points**: `handleNodesChange`, `onEdgesChange`, `onConnect`, `handleDeleteNode`, etc.

**Impact for View-Only** – we will gate the mutating callbacks + keyboard shortcuts behind a `viewOnly` prop.

### 2. Manager / Hooks

**`useDigitalTwinManager.ts`**
* Central hub combining many sub-hooks (state, interaction, save/validate, templates, canvas view, etc.).
* Returns three structured prop-bags:
  • `simulationToolbarProps`
  • `leftPanelProps`
  • `rightPanelProps`
* Maintains `selectedElement`, `simulationMode`, `isHydrated`, `reactFlowInstance`, etc.
* Exposes `handleAIFixRequest` that bridges validation issues → AI chat.

**`useNodeEdgeActions.ts`**
* Pure mutation helpers (add / delete / update nodes & edges).
* Relies on `setNodes`, `setEdges`, `setSelectedElement`.
* Notable exported fns: `handleAddNode`, `handleDeleteNode`, `handleUpdateNodePositions`, `handleAddMultipleEdges`, etc.
* **onConnect** builds a default `transportEdge` with risk metadata.

**`useInteraction.ts`**
* Tracks current selection & double-click interactions.
* Double-click on a _template group_ node triggers `handleUngroupTemplate`.
* Adds global <kbd>u</kbd> shortcut to ungroup when template selected.

### 3. Layout Components

**`SimulationToolbar.tsx`**
* Floating Save Button, Save dialog, and Intelligence Analysis dialog.
* Props include full `nodes` & `edges` arrays (required for save dialog previews).
* Detects `simulationMode` to disable save operations.
* Persists dialog inputs via `nuqs` query params (`saveName`, `saveDescription`).

**`LeftPanel.tsx`**
* Collapsible sidebar (48 px when collapsed → 320 px expanded).
* Three rendering states: _collapsed_, _immersive AI chat_, _builder palette_.
* Uses `chat` query param to toggle immersive mode.
* Drag-source for node templates; fires `onAddNodeAtPosition` when dropped.

**`RightPanel/index.tsx` & sub-files**
* Inspector that switches between **Node**, **Edge**, **Template Group** configs.
* Persists unsaved changes via debounced `onSave` (250 ms default).
* Collapsible mini state (tiny 48 px bar) handled in **`CollapsedState.tsx`**.
* Delete action guarded by cookie (`deleteNodeSkipConfirmation`).

### 4. Utilities

**`lib/utils/url-compression.ts`**
* Provides `compressArchData`, `decompressArchData`, and helpers.
* gzip ➜ base64 ➜ URL-safe.  Versioned (`v1:` prefix).
* Logs compression ratio to console.

### 5. Dashboard

**`display/dashboard.tsx`**
* Fetches user supply-chains via `getUserSupplyChains(userId)`.
* Renders list inside animated glassmorphic cards.
* Provides `handleDelete` (delete supply chain) & `handleRefresh`.
* Uses `view` query param (reserved) – currently unused.

**`display/digital-twin-card.tsx`**
* Stateless card linking to `/digital-twin?twinId=${id}`.
* Shows risk/date tags with coloured badges.
* No view-icon yet – will be added per checklist.

---

> **Takeaway**: All mutation logic funnels through **`useNodeEdgeActions`** and keyboard shortcuts inside **`digital-twin-canvas.tsx`**.  Implementing View-Only mode therefore requires:
> 1. `viewOnly` prop plumbed to `useDigitalTwinManager`.
> 2. Guard all mutation functions & delete shortcuts via simple `if (viewOnly) return;` wrappers (`guardMutation`).
> 3. Hide/disable save-related UI (`SimulationToolbar`, Floating button).

💡 **Pro-tip**: Because `SimulationToolbar` already receives `simulationMode`, we can extend this prop as `viewOnly` to reuse existing disable logic with minimal churn.

🚦 The new “View-Only” mode is a multi-layer feature that touches routing, data-fetch, canvas logic, UI, and types.  
Because it spans many areas it falls under the “complex new feature” category, so per the workspace’s **Expert Planning Assistant** guideline I am providing an **executable implementation plan first** (no code edits in this step).  
The plan is broken into clearly scoped tasks that can be tackled sequentially or in parallel by the next agent(s).

---


## Phase 1 – Shared Types & API (Foundation)

| Task | File | Notes |
|------|------|-------|
| 1.1 | `types/supply-chain.ts` | Export `SupplyChain`, `SupplyChainNode`, `SupplyChainEdge`, and `SupplyChainArch` (`{ nodes; edges }`). |
| 1.2 | `lib/api/supply-chain.ts` | • Add `getSupplyChainById(id: string): Promise<SupplyChainArch>` wrapper around edge-function.<br/>• Re-export the new types so UI can `import { SupplyChainArch } …`. |
| 1.3 | `lib/utils/url-compression.ts` | Ensure `compressArchData` / `decompressArchData` are exported from index for reuse. |

---

## Phase 2 – View Route Skeleton

| Task | File / Folder | Notes |
|------|---------------|-------|
| 2.1 | `app/(main)/digital-twin/view/[id]/page.tsx` | Client component.<br/>*Stage-1 skeleton*: read `id` via `useParams`, show `DigitalTwinSkeleton` while waiting. |
| 2.2 | `app/(main)/digital-twin/view/[id]/loading.tsx` | Simply re-export `DigitalTwinSkeleton`. |
| 2.3 | `lib/hooks/useSupplyChainView.ts` | New hook: fetch by `id`, compress arch, manage `arch` query param (URL ≤1800 chars else sessionStorage fallback). Returns `{ loading, error, nodes, edges }`. |

---

## Phase 3 – Canvas “viewOnly” Plumbing

| Task | File | Notes |
|------|------|-------|
| 3.1 | `components/digital-twin/canvas/digital-twin-canvas.tsx` | Add `viewOnly?: boolean` prop. Pass down to `useDigitalTwinManager`. Disable keyboard shortcuts when `viewOnly`. |
| 3.2 | `…/canvas/hooks/useDigitalTwinManager.ts` | Accept `viewOnly`; include it in the three prop-bags. |
<!-- | 3.3 | `…/canvas/hooks/useNodeEdgeActions.ts` & `useInteraction.ts` | Wrap all mutators in `guardMutation(fn, !viewOnly)`. |  do not touch it actions will be  handleed later  -->
| 3.4 | `SimulationToolbar.tsx` | If `viewOnly`, hide/disable Save / Intelligence buttons | prefer to hide the save button .
| 3.5 | `digital-twin-canvas.tsx` | When `viewOnly`, set ReactFlow props `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={true}`, etc. |

---

## Phase 4 – Read-Only UI Components

| Task | File | Notes |
|------|------|-------|
| 4.1 | `components/digital-twin/layout/view-mode/index.ts` | Barrel export. |
| 4.2 | `…/ReadOnlyRightPanel.tsx` | Inspector that shows properties only. Uses `useReactFlow` to react to selection. |
| 4.3 | `…/ViewModeHeader.tsx` | Slim header with “Back to Dashboard” button; no Save. |

---

## Phase 5 – Dashboard “Eye” Icon

| Task | File | Notes |
|------|------|-------|
| 5.1 | `components/digital-twin/display/digital-twin-card.tsx` | Add `<Eye>` icon + tooltip; on click `router.push('/digital-twin/view/'+id)`. |
| 5.2 | `…/display/dashboard.tsx` | No change unless extra props are needed. |

---

## Phase 6 – URL-Length Safeguard

| Task | File | Notes |
|------|------|-------|
| 6.1 | `lib/utils/url-compression.ts` | Add `storeArchInSession(id, arch)` util. |
| 6.2 | `useSupplyChainView.ts` | If compressed string > 1800 chars ➜ `storeArchInSession`, append `archKey=id` param instead of `arch`. |
| 6.3 | Route page | On first render check for `archKey`; if present, read from sessionStorage. |

---

## Phase 7 – Tests / QA (Manual)

Run through the checklist in `docs/TODO.md` once implementation is complete.

---

## Phase 8 – Docs & Hygiene

1. Update `docs/TODO.md` as items complete.  
2. Add a “View-Only Mode” section in `README.md`.  
3. Ensure `pnpm lint && pnpm typecheck` pass.  

---

# 🏗️ Suggested Work Order for Next Agent(s)

1. Complete **Phase 1** (types + API) and export utilities.  
2. Build **Phase 2** hook and page skeleton; confirm it renders skeleton and fetches data (console-log nodes/edges).  
3. Implement **Phase 3** canvas guarding (minimal UI changes first).  
4. Add **ReadOnlyRightPanel** (**Phase 4**) so basic inspection works.  
5. Wire **Eye** icon in dashboard (**Phase 5**) to enable navigation.  
6. Finish compression fallback (**Phase 6**).  
7. Polish UI, docs, QA.

---

# 📌 What’s Done vs. Outstanding

Nothing has been changed in the codebase yet.  
The plan above decomposes the original blueprint into concrete, PR-ready tasks with file-level granularity.  
The **next agent** can pick up at **Phase 1, Task 1.1**.
