(function () {
  const G = window.GREENROOM;
  const $ = (id) => document.getElementById(id);

  const state = {
    show: { ...G.show },
    rundown: G.rundown.map((s) => ({ ...s })),
    queue: [],
    log: [],
    webmcp: false,
    lastTool: "—",
  };

  function nowClock() {
    const elapsed = Math.max(0, Date.now() - state.show.startedAt);
    const total = Math.floor(elapsed / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function log(kind, msg) {
    const line = `[${nowClock()}] ${msg}`;
    state.log.unshift({ kind, line });
    state.log = state.log.slice(0, 40);
    renderLog();
  }

  function searchBible(query) {
    const q = (query || "").toLowerCase();
    const hits = [];
    G.bible.facts.forEach((f) => {
      const blob = `${f.topic} ${f.claim} ${f.source}`.toLowerCase();
      if (!q || blob.includes(q) || q.split(/\s+/).some((w) => w.length > 2 && blob.includes(w))) hits.push(f);
    });
    G.bible.banned.forEach((b) => {
      if (!q || b.toLowerCase().includes(q)) hits.push({ topic: "banned", claim: b, status: "caution", source: "Show Bible / banned list" });
    });
    if (q && G.guest.name.toLowerCase().includes(q.split(" ")[0])) {
      hits.push({ topic: "guest", claim: `${G.guest.name} (${G.guest.pronunciation}) — ${G.guest.title}`, status: "confirmed", source: "Show Bible / guest card" });
    }
    return hits.slice(0, 6);
  }

  function factCheck(claim) {
    const text = (claim || "").toLowerCase();
    const findings = G.bible.facts.map((f) => {
      const topicHit = f.topic.toLowerCase().split(/\s+/).some((w) => w.length > 3 && text.includes(w));
      const numberInClaim = text.match(/\$?\d[\d,]*/g) || [];
      let verdict = "unrelated";
      if (topicHit || numberInClaim.some((n) => f.claim.toLowerCase().includes(n.replace(",", "")))) {
        if (/\$5,000|5000|five thousand/.test(text) && f.id === "az-ev-rebate") verdict = "mismatch";
        else if (/60 miles|sixty miles/.test(text) && f.id === "l2-time") verdict = "mismatch";
        else verdict = f.status === "caution" ? "caution" : "supported";
      }
      return { ...f, verdict };
    }).filter((f) => f.verdict !== "unrelated");

    if (!findings.length) {
      return { verdict: "not_in_bible", summary: "This claim is not in the Show Bible. Do not confirm it on air. Hold for producer.", findings: [] };
    }
    if (findings.some((f) => f.verdict === "mismatch")) {
      const bad = findings.find((f) => f.verdict === "mismatch");
      return { verdict: "mismatch", summary: `Conflict with Show Bible (${bad.topic}): ${bad.claim}`, findings };
    }
    if (findings.some((f) => f.verdict === "caution")) {
      const c = findings.find((f) => f.verdict === "caution");
      return { verdict: "caution", summary: `Caution: ${c.claim}`, findings };
    }
    return { verdict: "supported", summary: findings[0].claim, findings };
  }

  function currentSegment() {
    return state.rundown.find((s) => s.status === "live") || state.rundown[0];
  }

  const tools = {
    get_show_state: {
      name: "get_show_state",
      description: "Read the live show clock, current segment, guest, and producer queue. Use this before acting.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => {
        const live = currentSegment();
        return { show: state.show.title, episode: state.show.episode, status: state.show.status, clock: nowClock(), host: state.show.host, guest: G.guest.name, liveSegment: live ? { id: live.id, title: live.title } : null, queueLength: state.queue.length };
      },
    },
    search_show_bible: {
      name: "search_show_bible",
      description: "Search the private Show Bible: confirmed facts, banned topics, sponsor rules, pronunciations. Never use the open web for on-air numbers.",
      inputSchema: { type: "object", properties: { query: { type: "string", description: "Topic, name, or phrase to look up" } }, required: ["query"], additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async ({ query }) => ({ query, hits: searchBible(query) }),
    },
    fact_check_claim: {
      name: "fact_check_claim",
      description: "Check a spoken or drafted claim against the Show Bible only. Returns supported, mismatch, caution, or not_in_bible.",
      inputSchema: { type: "object", properties: { claim: { type: "string", description: "The claim as heard or drafted" } }, required: ["claim"], additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async ({ claim }) => factCheck(claim),
    },
    lookup_guest: {
      name: "lookup_guest",
      description: "Return guest pronunciation, bio, do/don't list from the Show Bible.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => G.guest,
    },
    get_sponsor_read: {
      name: "get_sponsor_read",
      description: "Return the approved sponsor copy and hard stops.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => G.bible.sponsors,
    },
    queue_correction: {
      name: "queue_correction",
      description: "Put a correction card on the producer desk for the host. Does not go on air until the producer sends it.",
      inputSchema: { type: "object", properties: { claim: { type: "string" }, correction: { type: "string" }, urgency: { type: "string", enum: ["now", "next_break", "after_show"] } }, required: ["claim", "correction"], additionalProperties: false },
      execute: async ({ claim, correction, urgency }) => {
        const item = { id: "q" + Date.now(), type: "correction", claim, correction, urgency: urgency || "now", status: "pending" };
        state.queue.unshift(item);
        renderQueue();
        log("warn", `Correction queued (${item.urgency}): ${correction}`);
        return { ok: true, id: item.id, note: "Waiting on producer. Not on air yet." };
      },
    },
    hold_for_producer: {
      name: "hold_for_producer",
      description: "Flag a moment the producer should handle. Use when a claim is not in the bible or a banned topic appears.",
      inputSchema: { type: "object", properties: { reason: { type: "string" }, quote: { type: "string" } }, required: ["reason"], additionalProperties: false },
      execute: async ({ reason, quote }) => {
        const item = { id: "h" + Date.now(), type: "hold", reason, quote, status: "pending" };
        state.queue.unshift(item);
        renderQueue();
        log("warn", `Hold: ${reason}`);
        return { ok: true, id: item.id };
      },
    },
    add_rundown_note: {
      name: "add_rundown_note",
      description: "Attach a short producer note to a rundown segment.",
      inputSchema: { type: "object", properties: { segmentId: { type: "string", description: "e.g. s3" }, note: { type: "string" } }, required: ["segmentId", "note"], additionalProperties: false },
      execute: async ({ segmentId, note }) => {
        const seg = state.rundown.find((s) => s.id === segmentId);
        if (!seg) return { ok: false, error: "Unknown segment" };
        seg.note = note;
        renderRundown();
        log("ok", `Note on ${segmentId}: ${note}`);
        return { ok: true, segment: seg };
      },
    },
    mark_segment: {
      name: "mark_segment",
      description: "Set a rundown item to live, done, next, or queued. Only one segment can be live.",
      inputSchema: { type: "object", properties: { segmentId: { type: "string" }, status: { type: "string", enum: ["live", "done", "next", "queued"] } }, required: ["segmentId", "status"], additionalProperties: false },
      execute: async ({ segmentId, status }) => {
        const seg = state.rundown.find((s) => s.id === segmentId);
        if (!seg) return { ok: false, error: "Unknown segment" };
        if (status === "live") state.rundown.forEach((s) => { if (s.status === "live") s.status = "done"; });
        seg.status = status;
        renderRundown();
        log("ok", `Segment ${segmentId} → ${status}`);
        return { ok: true, rundown: state.rundown };
      },
    },
  };

  async function callTool(name, input) {
    const tool = tools[name];
    if (!tool) throw new Error("Unknown tool " + name);
    state.lastTool = name;
    $("last-tool").textContent = name;
    log("ok", `tool ${name}(${JSON.stringify(input || {})})`);
    const result = await tool.execute(input || {});
    log("ok", `→ ${JSON.stringify(result).slice(0, 280)}`);
    return result;
  }

  async function registerWebMCP() {
    const api = document.modelContext;
    if (!api || typeof api.registerTool !== "function") {
      $("webmcp-pill").textContent = "WebMCP: page fallback";
      $("webmcp-pill").classList.remove("on");
      $("webmcp-status").textContent = "not in agent browser — using in-page agent desk";
      log("warn", "document.modelContext missing. Tools still run in the page so the producer desk works anywhere.");
      return;
    }
    for (const tool of Object.values(tools)) {
      await api.registerTool({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
        execute: async (input) => callTool(tool.name, input || {}),
      });
    }
    state.webmcp = true;
    $("webmcp-pill").textContent = "WebMCP: registered";
    $("webmcp-pill").classList.add("on");
    $("webmcp-status").textContent = `${Object.keys(tools).length} tools on this origin`;
    log("ok", `Registered ${Object.keys(tools).length} WebMCP tools on document.modelContext`);
  }

  function renderRundown() {
    $("rundown").innerHTML = state.rundown.map((s) => `
      <article class="segment ${s.status}">
        <div class="seg-top"><span>${s.id} · ${s.mins} min</span><span class="badge ${s.status}">${s.status}</span></div>
        <div class="seg-title">${s.title}</div>
        ${s.note ? `<div class="note-row" style="padding:8px 0 0;color:var(--amber)">${s.note}</div>` : ""}
      </article>`).join("");
  }

  function renderFacts() {
    $("facts").innerHTML = G.bible.facts.map((f) => `
      <div class="fact">
        <div class="topic">${f.topic}<span class="tag ${f.status}">${f.status}</span></div>
        <div>${f.claim}</div>
      </div>`).join("");
  }

  function renderQueue() {
    if (!state.queue.length) {
      $("queue").innerHTML = `<div class="queue-item"><div class="from">EMPTY</div>Producer queue is clear. Agent cards land here — they do not go on air alone.</div>`;
      $("queue-count").textContent = "0 waiting";
      return;
    }
    $("queue-count").textContent = `${state.queue.length} waiting`;
    $("queue").innerHTML = state.queue.map((item) => {
      if (item.type === "correction") {
        return `<div class="queue-item new">
            <div class="from">AGENT · ${item.urgency} · ${item.status}</div>
            <div style="margin-top:6px"><s style="color:var(--muted)">${item.claim}</s></div>
            <div style="margin-top:4px">${item.correction}</div>
            <div class="queue-actions">
              <button class="primary" data-send="${item.id}">Send to host</button>
              <button data-drop="${item.id}">Drop</button>
            </div>
          </div>`;
      }
      return `<div class="queue-item new">
          <div class="from">HOLD · ${item.status}</div>
          <div style="margin-top:6px">${item.reason}</div>
          ${item.quote ? `<div style="color:var(--muted);margin-top:4px">“${item.quote}”</div>` : ""}
          <div class="queue-actions">
            <button class="primary" data-send="${item.id}">Ack</button>
            <button data-drop="${item.id}">Drop</button>
          </div>
        </div>`;
    }).join("");
  }

  function renderLog() {
    $("tool-log").innerHTML = state.log.map((e) => `<div class="${e.kind}">${e.line}</div>`).join("");
  }

  function renderPeople() {
    $("ep-title").textContent = state.show.episode;
    $("guest-name").textContent = G.guest.name;
    $("guest-note").textContent = `${G.guest.pronunciation} · ${G.guest.title}`;
    $("host-name").textContent = state.show.host;
  }

  function tick() {
    $("clock").textContent = nowClock();
    $("footer-clock").textContent = nowClock();
  }

  async function runCannedDemo() {
    $("demo-btn").disabled = true;
    const claim = "Arizona gives you a $5,000 rebate if you buy an EV this year.";
    $("agent-prompt").value = claim;
    log("warn", "Guest just said the $5,000 rebate line.");
    await callTool("get_show_state", {});
    await new Promise((r) => setTimeout(r, 350));
    const check = await callTool("fact_check_claim", { claim });
    await new Promise((r) => setTimeout(r, 350));
    await callTool("queue_correction", {
      claim,
      correction: "Bible says $2,500 state rebate on qualifying new EVs — not $5,000. Do not let that number hang.",
      urgency: "now",
    });
    await callTool("add_rundown_note", { segmentId: "s3", note: "Rebate rumor hit early. Correction card is on the desk." });
    $("demo-btn").disabled = false;
    return check;
  }

  async function runPrompt() {
    const text = $("agent-prompt").value.trim();
    if (!text) return;
    const check = await callTool("fact_check_claim", { claim: text });
    if (check.verdict === "mismatch") {
      await callTool("queue_correction", { claim: text, correction: check.summary, urgency: "now" });
    } else if (check.verdict === "not_in_bible" || check.verdict === "caution") {
      await callTool("hold_for_producer", { reason: check.summary, quote: text });
    } else {
      await callTool("search_show_bible", { query: text });
    }
  }

  function bind() {
    $("demo-btn").addEventListener("click", runCannedDemo);
    $("run-btn").addEventListener("click", runPrompt);
    $("queue").addEventListener("click", (e) => {
      const send = e.target.getAttribute("data-send");
      const drop = e.target.getAttribute("data-drop");
      if (send) {
        state.queue = state.queue.filter((q) => q.id !== send);
        log("ok", "Producer sent card to host IFB");
        renderQueue();
      }
      if (drop) {
        state.queue = state.queue.filter((q) => q.id !== drop);
        log("warn", "Producer dropped card");
        renderQueue();
      }
    });
  }

  function init() {
    renderPeople();
    renderRundown();
    renderFacts();
    renderQueue();
    bind();
    tick();
    setInterval(tick, 1000);
    registerWebMCP();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.GreenroomTools = { callTool, tools };
})();
