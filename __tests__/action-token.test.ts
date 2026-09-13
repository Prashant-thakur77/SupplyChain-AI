import { describe, expect, it } from "vitest"
import { signAction, verifyAction } from "@/lib/action-token"

describe("action tokens", () => {
  it("round-trips and rejects tampering", () => {
    const t = signAction("dec-1", "approve", "user-1", 1)
    expect(verifyAction(t)).toEqual({ decisionId: "dec-1", action: "approve", userId: "user-1" })
    expect(verifyAction(t.slice(0, -2) + "zz")).toBeNull()
    const [p, m] = t.split("."); const forged = Buffer.from("dec-2|approve|user-1|9999999999").toString("base64url") + "." + m
    expect(verifyAction(forged)).toBeNull()
  })
  it("expires", () => { expect(verifyAction(signAction("d", "reject", "u", -1))).toBeNull() })
})
