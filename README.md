# Greenroom

Live show control room for indie podcasters. The producer and an agent share the same desk. The agent fact-checks against the **Show Bible**, never the open web. Nothing reaches the host until a human sends it.

Built for the [WebMCP Challenge](https://webmcp.devpost.com/).

## Why this exists

A guest says “Arizona gives you a $5,000 EV rebate.” The number is wrong. The producer is already riding levels, watching the rundown, and feeding the host. An agent that scrapes the open web will invent a third number. An agent that can only click the UI is too slow.

Greenroom publishes the show’s real actions as WebMCP tools on the live page:

- search the private Show Bible
- fact-check a spoken claim
- queue a correction card
- hold a banned topic for the producer
- move the rundown

The producer sees every tool call land on the same desk they are already using.

## Live demo

Open the hosted site (see the Devpost submission for the current URL) in **ChatGPT’s in-app browser** or in **Chrome with `chrome://flags/#enable-webmcp-testing` enabled**.

No login. The sample episode is already live.

1. Click **Run the live example**.
2. Watch `fact_check_claim` catch the $5,000 rebate rumor against the bible ($2,500).
3. A correction card appears in the producer queue.
4. Click **Send to host**. That is the handoff WebMCP is for: agent acts, human releases.

Or paste any claim into the agent desk and press **Check against bible**.

## WebMCP tools

Registered on `document.modelContext` when the browser supports WebMCP. The same functions run in-page so the product still works in a normal tab.

| Tool | Side effect |
|---|---|
| `get_show_state` | none (read) |
| `search_show_bible` | none (read) |
| `fact_check_claim` | none (read) |
| `lookup_guest` | none (read) |
| `get_sponsor_read` | none (read) |
| `queue_correction` | writes a card to the producer queue |
| `hold_for_producer` | writes a hold card |
| `add_rundown_note` | annotates a segment |
| `mark_segment` | changes rundown status |

Sensitive path: `queue_correction` never punches the host IFB. The producer does.

## Local

```bash
python3 -m http.server 4173
```

Open http://localhost:4173

## Stack

Static HTML / CSS / JS. No build step, no account, no backend. The Show Bible is local on purpose — the point is grounding, not another search box.

## License

MIT
