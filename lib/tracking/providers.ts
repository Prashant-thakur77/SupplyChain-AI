// Tracking providers behind one interface. `mock` simulates movement along the lane (progress by elapsed time);
// `carrier-webhook` is the real path: carriers/forwarders POST milestones to /api/shipments/events.
// An AIS/vessel API adapter (MarineTraffic, aisstream.io…) plugs in here as a third provider once a key exists.
export interface TrackingUpdate { reference: string; status?: "planned" | "in_transit" | "delayed" | "arrived" | "cancelled"; progress?: number; current_eta?: string | null; last_event?: string; location?: string }

export interface TrackingProvider { name: string; poll(shipments: { reference: string; etd: string | null; planned_eta: string | null; status: string }[]): Promise<TrackingUpdate[]> }

/** Simulated provider: linear progress between ETD and planned ETA; 15% of in-transit shipments pick up a delay event. */
export const mockProvider: TrackingProvider = {
  name: "mock",
  async poll(shipments) {
    const now = Date.now()
    return shipments.filter((s) => s.etd && s.planned_eta && s.status !== "arrived" && s.status !== "cancelled").map((s) => {
      const t0 = new Date(s.etd!).getTime(), t1 = new Date(s.planned_eta!).getTime()
      const p = Math.max(0, Math.min(1, (now - t0) / Math.max(1, t1 - t0)))
      const seed = [...s.reference].reduce((a, c) => a + c.charCodeAt(0), 0)
      const delayed = p > 0.3 && p < 1 && seed % 7 === 0
      return { reference: s.reference, progress: p, status: p >= 1 ? "arrived" : delayed ? "delayed" : p > 0 ? "in_transit" : "planned",
        current_eta: delayed ? new Date(t1 + 3 * 86400000).toISOString() : s.planned_eta, last_event: p >= 1 ? "Arrived" : delayed ? "Vessel delayed — port congestion (+3d)" : p > 0 ? "In transit" : "Booked" }
    })
  },
}

export function getProvider(): TrackingProvider {
  return mockProvider // switch on TRACKING_PROVIDER when an AIS adapter is configured
}
