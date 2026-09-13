// Signed, expiring action links so a decision can be approved from Slack or email with one click.
// Token = base64url(payload).base64url(HMAC-SHA256(payload, ACTION_SECRET)); payload = decisionId|action|userId|exp
import { createHmac, timingSafeEqual } from "crypto"

const secret = () => process.env.ACTION_SECRET ?? process.env.CRON_SECRET ?? process.env.AGENT_SERVICE_SECRET ?? "dev-action-secret"
const b64 = (s: string | Buffer) => (typeof s === "string" ? Buffer.from(s) : s).toString("base64url")

export function signAction(decisionId: string, action: "approve" | "reject" | "snooze", userId: string, ttlHours = 72): string {
  const exp = Math.floor(Date.now() / 1000) + ttlHours * 3600
  const payload = `${decisionId}|${action}|${userId}|${exp}`
  const mac = createHmac("sha256", secret()).update(payload).digest()
  return `${b64(payload)}.${b64(mac)}`
}

export function verifyAction(token: string): { decisionId: string; action: "approve" | "reject" | "snooze"; userId: string } | null {
  const [p, m] = token.split(".")
  if (!p || !m) return null
  const payload = Buffer.from(p, "base64url").toString()
  const expected = createHmac("sha256", secret()).update(payload).digest()
  const given = Buffer.from(m, "base64url")
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  const [decisionId, action, userId, exp] = payload.split("|")
  if (!decisionId || !["approve", "reject", "snooze"].includes(action) || Number(exp) < Date.now() / 1000) return null
  return { decisionId, action: action as any, userId }
}

export function actionLinks(decisionId: string, userId: string, appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "") {
  const base = appUrl.replace(/\/$/, "")
  const mk = (a: "approve" | "reject" | "snooze") => `${base}/d/${decisionId}/${a}?t=${signAction(decisionId, a, userId)}`
  return { approve: mk("approve"), reject: mk("reject"), snooze: mk("snooze") }
}
