import { describe, expect, it } from "vitest"
import { fmtMoney, summarizeOption } from "@/lib/decisions"

describe("summarizeOption", () => {
  it("formats a reroute option", () => {
    expect(summarizeOption({ id: "r1", label: "A → B", kind: "reroute", added_cost: 1000, added_days: 4, risk: "LOW", detail: "" })).toBe("+$1,000 · +4d · low risk")
  })
  it("omits cost for wait", () => {
    expect(summarizeOption({ id: "wait", label: "Wait", kind: "wait", added_cost: 0, added_days: 21, risk: "HIGH", detail: "" })).toBe("+21d · high risk")
  })
  it("money sign", () => {
    expect(fmtMoney(-250)).toBe("-$250")
    expect(fmtMoney(0)).toBe("$0")
  })
})
