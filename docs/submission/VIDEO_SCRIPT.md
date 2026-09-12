# Video script (≤ 5:00)

Record at 1440×900. Screen + voice-over. Keep the cursor slow. Use the `/demo` page for the live part.

| Time | Screen | Voice-over |
|---|---|---|
| 0:00–0:35 | Title card → landing hero | "Every operations manager I know finds out about a port closure from the news. Then they lose a day in spreadsheets: what does it hit, what do the alternatives cost, who do I call. It's repetitive, it's judgement-heavy, and it happens at 2 a.m. SupplyChain AI is an agent that does the watching and the arithmetic in the background — and only shows up with a decision." |
| 0:35–1:05 | Landing → click *Try the live demo* | "It's built for the person who owns 'keep the goods moving' at a small manufacturer or importer — five to fifty suppliers, no control tower. Here's a real twin: an EU electronics importer shipping from Shenzhen through Singapore and Suez to Berlin." |
| 1:05–2:35 | `/demo`: click **Port of Singapore closed**; let the activity panel run; hover the routes; open the decision card | "I'll close the Port of Singapore. Watch the agent. The **Analyst** — a Strands agent — grades the event: severity HIGH, 95% confidence, and it separates what *failed* from what's *downstream*. Then the **routing engine**, pure Dijkstra, computes the real alternate lanes with exact cost and days — no model invents a route. Then a **Strands Graph** runs Router and Impact in parallel and feeds the Strategist. Twenty-five seconds later: one decision. Reroute via Colombo: plus a thousand dollars, plus five days, low risk. Or wait. Or mitigate. With the rationale and the source." |
| 2:35–3:00 | Click **Approve**; show toast; open **Trace** | "I approve. In the full app that writes the decision, notifies the team, and the agent remembers it. Every agent run is traced — duration, tokens — this is not a black box." |
| 3:00–3:30 | Sidebar copilot: type *What if Suez is blocked?* | "The same tools power a copilot. 'What if Suez is blocked?' — it calls blast radius and reroute tools and answers with the exact numbers." |
| 3:30–4:15 | `docs/architecture.png`; scroll `agent-service/graphs/incident.py` and `agents/router.py` briefly | "Under the hood: a Python agent service on the Strands Agents SDK — eight agents with typed outputs, two GraphBuilder graphs, hooks for tracing, and a provider switch: Gemini today, Amazon Bedrock with one environment variable. It already implements the AgentCore runtime contract, so the same container deploys there. A Next.js app streams everything to the browser and holds the Decision Inbox." |
| 4:15–4:45 | Decision Inbox page (or screenshot) + cron scan JSON | "In production Sentinel scans every twin every fifteen minutes from a scheduler. Nothing below HIGH interrupts anyone. When it matters, you get one card." |
| 4:45–5:00 | Repo README + closing card | "Open source, MIT, built with Strands. Stop finding out from the news." |

Tips: mute notifications; pre-warm the model (run one demo before recording); if a run takes >40 s, cut to the finished state.
