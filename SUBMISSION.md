# Devpost description — Greenroom

Copy into the Devpost text fields. Written for judges, not for a landing page.

---

## Short tagline

A live podcast desk where the producer and an agent share the same board — and the agent is only allowed to trust the Show Bible.

---

## Why this use case is a strong fit for WebMCP

Live radio and podcast control rooms are already shared workspaces. The producer, host, and now an agent need the **same clock, the same rundown, and the same private notes**. That is exactly what WebMCP is for: tools registered on the page the human is looking at, not a sidecar chatbot with a different context.

Scraping the UI fails here. A rundown is not a form. A Show Bible is not in the DOM as a search box. A correction must not go on air because an agent found a button labeled “send.” WebMCP lets the site declare the actual verbs — `fact_check_claim`, `queue_correction`, `hold_for_producer` — with schemas and side-effect descriptions the agent can use in one turn.

The other half of the fit: grounding. Indie shows get wrecked by a single bad number. The agent is forbidden from the open web for on-air facts. The tools only read the bible the producer already maintains. WebMCP is how you enforce that boundary without hiding the work.

## How it creates a better experience

Before: producer hears a wrong number, alt-tabs to notes, types a Slack to themselves, misses the next cue.

After: agent on the same page runs `fact_check_claim` on “Arizona gives you a $5,000 rebate,” gets a mismatch against the bible ($2,500), and `queue_correction` drops a card on the desk. Producer hits **Send to host**. The host gets one clean line. The audience never hears the agent. The producer never left the board.

People still drive the show. The agent does the lookup that used to cost a missed transition.

## What people and agents can do together that was difficult before

- Check a spoken claim against a private fact sheet in the same second it is said, without dumping the host’s notes into a general-purpose chat.
- Put a correction in front of a human without making it live.
- Move a rundown item or attach a note the producer can see immediately, because the tool writes into the same state the UI is rendering.
- Keep sponsor hard-stops and banned topics in the tool surface, so the agent can `hold_for_producer` instead of improvising.

That loop — hear, check, queue, human release — is ugly if the agent is guessing through a webpage. It is one tool sequence with WebMCP.

## How WebMCP is implemented

The page registers nine tools on `document.modelContext.registerTool` when the API exists (ChatGPT’s in-app browser, or Chrome with `chrome://flags/#enable-webmcp-testing`).

Each tool wraps the same functions the on-page agent desk uses. Read tools set `readOnlyHint: true`. Write tools mutate the rundown and producer queue and return enough state for the agent to verify the card actually landed.

If `document.modelContext` is missing, the product still runs. The in-page desk calls the same executors so judges and producers are not stuck on a flag. The live URL needs no login. Sample episode “The Shop Floor — Ep. 47” is already on the air when the page opens.

---

## Testing instructions

1. Open the live URL in ChatGPT desktop’s in-app browser, or Chrome 149+ with WebMCP testing enabled.
2. You should already be on a live episode. No signup.
3. Click **Run the live example**, or ask the agent: “The guest just said Arizona has a $5,000 EV rebate. Check that and queue a correction if the bible disagrees.”
4. Confirm a card appears in the producer queue. Click **Send to host**.
5. Optional: “What’s Maya’s pronunciation and what should I not ask her?”

Credentials: none.
