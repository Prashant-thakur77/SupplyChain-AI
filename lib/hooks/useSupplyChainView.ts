import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupplyChainById } from '@/lib/api/supply-chain'
import { compressArchData, decompressArchData, storeArchInSession } from '@/lib/utils/url-compression'
import type { SupplyChainArch } from '@/types/supply-chain'

interface SupplyChainViewState {
  loading: boolean
  error: Error | null
  arch: SupplyChainArch | null
}

/**
 * React hook that powers the Digital-Twin "View-Only" route.
 *
 * Responsibilities:
 * 1. Fetch the supply-chain architecture (nodes & edges) by `id` via edge-function wrapper.
 * 2. Compress the architecture and persist it to the `arch` query parameter so sibling
 *    components (e.g. the canvas) can consume state via `nuqs` without additional fetches.
 * 3. Implements a fallback when the compressed URL would exceed 1 800 characters – the
 *    architecture is stored in `sessionStorage` under the key `view-arch-<id>` and the
 *    query parameter becomes `archKey=<id>` instead.
 *
 * The hook is intentionally side-effect-y (URL + sessionStorage) because it sits at the
 * _route_ layer.  Down-stream components receive a clean, immutable `{nodes, edges}`
 * object to render the read-only canvas.
 */
export function useSupplyChainView(id: string | null): SupplyChainViewState {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [state, setState] = useState<SupplyChainViewState>({
    loading: !!id,
    error: null,
    arch: null,
  })

  useEffect(() => {
    if (!id) return

    // If `arch` OR `archKey` already exists in the URL we assume another render
    // cycle (or hard-refresh) already populated the state and bail out early.
    const archParam = searchParams.get('arch')
    const archKeyParam = searchParams.get('archKey')

    if (archParam) {
      try {
        const arch = decompressArchData(archParam) as SupplyChainArch
        setState({ loading: false, error: null, arch })
        return
      } catch {
        // Malformed compressed data – fall through to refetch
      }
    }

    if (archKeyParam) {
      try {
        const stored = sessionStorage.getItem(`view-arch-${archKeyParam}`)
        if (stored) {
          const arch = JSON.parse(stored) as SupplyChainArch
          setState({ loading: false, error: null, arch })
          return
        }
      } catch {
        // Continue with fetch
      }
    }

    // --- Fetch from edge function ------------------------------------------------
    ;(async () => {
      try {
        const arch = await getSupplyChainById(id)

        // --- Normalise node positions --------------------------------------------------------
        const normalisedNodes = arch.nodes.map((n: any) => {
          // If a React Flow compatible `position` already exists use it.
          if (n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number') {
            return n;
          }

          // Fallback 1: Check for position embedded inside the data JSON (saved during persistence)
          if (n.data && n.data.position && typeof n.data.position.x === 'number' && typeof n.data.position.y === 'number') {
            return { ...n, position: n.data.position };
          }

          // Fallback 2: Check for legacy lat/lng columns
          if (typeof n.location_lat === 'number' && typeof n.location_lng === 'number') {
            return { ...n, position: { x: n.location_lng, y: n.location_lat } };
          }

          // If everything fails default to (0,0) – prevents ReactFlow from crashing
          return { ...n, position: { x: 0, y: 0 } };
        });

        const normalisedArch = { ...arch, nodes: normalisedNodes } as SupplyChainArch;

        // Compress and decide whether to inline or use sessionStorage fallback.
        const compressed = compressArchData(normalisedArch)
        const shouldFallback = compressed.length > 1800 // RFC-friendly URL length safeguard

        const url = new URL(window.location.href)

        if (shouldFallback) {
          storeArchInSession(id, normalisedArch)
          url.searchParams.set('archKey', id)
          url.searchParams.delete('arch')
        } else {
          url.searchParams.set('arch', compressed)
          url.searchParams.delete('archKey')
        }

        // Replace the current history entry so the back-button isn't polluted.
        router.replace(url.toString())

        setState({ loading: false, error: null, arch: normalisedArch })
      } catch (err: any) {
        setState({ loading: false, error: err, arch: null })
      }
    })()
  }, [id, router, searchParams])

  return state
} 