# Agents for Humans: building an autonomous supply-chain resilience agent with Strands

*Draft for builder.aws.com. Title must contain "Agents for Humans".*

## The chore

Operations managers at small manufacturers find out about port closures from the news and then spend a day in
spreadsheets. I wanted an agent that watches for them and only interrupts with a framed decision. This post is about
how the Strands Agents SDK shaped the design.

## 1. Agents are functions with typed outputs

Every agent in the service is a Strands `Agent` with `@tool`s and a Pydantic `structured_output_model`:

```python
res = agent(prompt, structured_output_model=Assessment)
assessment = res.structured_output  # severity, confidence, failed_node_ids, affected_node_ids …
```

That single decision made the rest of the system boring in the best way: the UI, the database and the next agent all
consume objects, not prose.

## 2. Keep the math out of the model

Operators act on the numbers, so routes are computed by Dijkstra and Yen's k-shortest in plain Python and *injected*
into the Router agent's prompt. The Router ranks and explains; it can only return ids that exist. When the model was
wrong about which nodes had "failed" (it listed downstream nodes), splitting `failed_node_ids` from
`affected_node_ids` in the schema fixed the whole pipeline.

## 3. GraphBuilder for the parallel part

```python
gb = GraphBuilder()
gb.add_node(router, "router"); gb.add_node(impact, "impact"); gb.add_node(strategist, "strategist")
gb.add_edge("router", "strategist"); gb.add_edge("impact", "strategist")
gb.set_entry_point("router"); gb.set_entry_point("impact")
result = gb.build()(task)
ranking = result.results["router"].result.structured_output
```

Two entry points run concurrently; the strategist gets both outputs; `execution_order` and token usage stream to the UI.

## 4. Hooks for observability

A `HookProvider` on `BeforeInvocationEvent`/`AfterInvocationEvent` writes one row per agent run to `agent_traces`.
The product's "Trace" drawer is just a query on that table.

## 5. Provider switch and AgentCore

`AGENT_MODEL_PROVIDER=bedrock` swaps `GeminiModel` for `BedrockModel`; nothing else changes. The FastAPI service also
implements `POST /invocations` and `GET /ping`, with a `BedrockAgentCoreApp` entrypoint, so it deploys to Amazon Bedrock
AgentCore Runtime unchanged.

## What I'd tell another builder

- Put the structured schema first; prompts follow.
- Compute what can be computed; let the agent rank and explain.
- Stream the graph's node events — users trust what they can watch.

Repo: https://github.com/Prashant-thakur77/SupplyChain-AI
