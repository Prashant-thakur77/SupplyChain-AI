# Agents for Humans: a supply-chain resilience agent built with Strands Agents on Amazon Bedrock

*Published on builder.aws.com. Title must contain "Agents for Humans".*

## The chore I wanted to get rid of

If you run operations at a small manufacturer, you find out about a port closure the same way everyone else does: from the news. Then you lose a day in spreadsheets working out which orders are stuck, which route is still open and what it will cost. I wanted an agent that does the watching and the working out, and only shows up when there is a real decision to make.

This post is about how the Strands Agents SDK shaped the design, and a few things I would do the same way again.

## Every agent returns an object, not a paragraph

Each agent in the service is a Strands `Agent` with a handful of `@tool` functions and a Pydantic `structured_output_model`:

```python
res = agent(prompt, structured_output_model=Assessment)
assessment = res.structured_output   # severity, confidence, failed_node_ids, affected_node_ids
```

That one choice made everything downstream boring in the best way. The UI, the database and the next agent in the chain all consume typed objects. Nobody parses prose.

## The math never runs inside the model

Operators act on numbers, so the numbers cannot be guesses. Routes are computed by Dijkstra and Yen's k-shortest algorithm in plain Python and injected into the Router agent's prompt. The Router ranks the candidates and explains the trade-offs, and it can only return ids that actually exist.

The moment this paid for itself was when the Analyst kept listing downstream sites as "failed". Nothing was routable because the engine thought half the network was gone. Splitting `failed_node_ids` from `affected_node_ids` in the schema fixed the whole pipeline in an afternoon. When the contract is typed, bugs like that are visible.

## GraphBuilder for the part that should run in parallel

The incident pipeline is a Strands graph: the Router and the Impact analyst run at the same time, and the Strategist receives both results.

```python
gb = GraphBuilder()
gb.add_node(router_agent, "router")
gb.add_node(impact_agent, "impact")
gb.add_node(strategist_agent, "strategist")
gb.add_edge("router", "strategist")
gb.add_edge("impact", "strategist")
gb.set_entry_point("router")
gb.set_entry_point("impact")
result = gb.build()(task)
```

The execution order and token usage come back on the result, and I stream them to the browser so the operator can watch the graph work.

## Hooks make observability free

A `HookProvider` listening on `BeforeInvocationEvent` and `AfterInvocationEvent` writes one row per agent run to an `agent_traces` table: duration, tokens, success, which stage of which workflow. The product's Agent Ops page and the "trace" drawer on every decision are just queries on that table. I never wrote a logging layer.

## Amazon Bedrock and AgentCore

Setting `AGENT_MODEL_PROVIDER=bedrock` swaps the model for `BedrockModel` with a cross-region inference profile. Nothing else in the agents changes, which is the whole point of the Strands model abstraction.

The FastAPI service also implements `POST /invocations` and `GET /ping`, with a `BedrockAgentCoreApp` entrypoint, so the same container deploys to Amazon Bedrock AgentCore Runtime. The IAM execution role, a least-privilege policy for Bedrock invoke, ECR pull, CloudWatch logs and X-Ray, and an EventBridge rule for the fifteen-minute Sentinel loop live in `infra/aws/`. AgentCore's session isolation and built-in observability line up neatly with the `agent_traces` rows the hooks already write.

One more Strands feature I leaned on is `A2AServer`. The Lane Assessor agent is exposed over the Agent-to-Agent protocol at `/a2a`, so a procurement bot or a customer's own agent can ask "is Shenzhen to Rotterdam safe this week?" and get the exact engine numbers back.

## Surviving free tiers

Not every builder has a billed model account on day one. Strands made it cheap to support four providers behind one flag: Bedrock, Gemini, anything OpenAI-compatible such as Groq, and a local Ollama model. The incident graph is written so that when a node fails, whether from a rate limit or a refused structured-output tool, the deterministic engine still produces a decision. It is marked partial with reduced confidence, but the operator gets something they can act on rather than nothing.

## What I would tell another builder

Write the output schema first and let the prompts follow. Compute whatever can be computed and let the agent rank and explain. And stream the graph's node events to the screen, because people trust what they can watch.

Repo: https://github.com/Prashant-thakur77/SupplyChain-AI
Live demo: https://supplychain-ai-nine.vercel.app/demo
