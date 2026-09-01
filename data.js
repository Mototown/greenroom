/* Show Bible + rundown for the sample episode.
   Agents must ground claims here. Never invent numbers from the open web. */

window.GREENROOM = {
  show: {
    title: "The Shop Floor",
    episode: "Ep. 47 — Heat, Batteries, and Honest Numbers",
    host: "Lena Cruz",
    producer: "Moshi",
    studio: "Phoenix, AZ",
    durationMin: 48,
    startedAt: Date.now() - 18 * 60 * 1000,
    status: "LIVE",
  },
  guest: {
    name: "Maya Chen",
    pronunciation: "MY-uh chen",
    title: "Co-op lead, Desert EV Collective",
    bio: "Runs a member-owned EV repair shop in Mesa. Former Tesla service tech. Speaks in shop hours, not press releases.",
    do: [
      "Ask how desert heat actually kills packs",
      "Let her correct hype about range",
      "Use her co-op waitlist story",
    ],
    dont: [
      "Do not ask her to dunk on a specific OEM by name",
      "Do not request unpublished warranty numbers",
    ],
  },
  bible: {
    voice: "Warm, specific, slightly skeptical. Talk like a good shop manager, not a keynote.",
    sponsors: [
      {
        name: "Harkins Coffee",
        read: "This hour is brought to you by Harkins Coffee on Seventh Street. Cold brew that survives a 110-degree parking lot.",
        hardStop: "No health claims. No 'best coffee in Phoenix' line.",
      },
    ],
    facts: [
      {
        id: "az-ev-rebate",
        topic: "Arizona EV rebate",
        claim: "Arizona currently offers a $2,500 state rebate on qualifying new EVs, not $5,000.",
        source: "Show Bible / AZ DEQ program sheet, updated June 2026",
        status: "confirmed",
      },
      {
        id: "heat-range",
        topic: "Desert range loss",
        claim: "Maya's shop sees 12–18% summer range loss on commuter EVs parked outdoors in Phoenix metro, cabin preconditioning off.",
        source: "Guest-provided shop log, n=86 vehicles, Jun–Aug 2025",
        status: "confirmed",
      },
      {
        id: "l2-time",
        topic: "Level 2 charge time",
        claim: "A typical 11 kW Level 2 home charger adds about 30–35 miles per hour on Maya's commuter fleet, not 60.",
        source: "Guest briefing notes",
        status: "confirmed",
      },
      {
        id: "pack-swap",
        topic: "Pack replacement cost",
        claim: "Do not quote a single pack-replacement price on air. Range in the bible is $8k–$22k depending on model year. Always say the range.",
        source: "Legal / producer note",
        status: "caution",
      },
    ],
    banned: [
      "Medical claims about cabin air or 'EMF'",
      "Stock tips or 'buy this ticker'",
      "Unverified recall numbers",
      "Naming a customer's vehicle or plate",
    ],
    pronunciations: {
      "DEQ": "D-E-Q",
      "CHAdeMO": "CHAD-uh-mo",
      "NACS": "nacks",
    },
  },
  rundown: [
    { id: "s1", title: "Cold open + Harkins read", mins: 3, status: "done" },
    { id: "s2", title: "Maya walks in — shop origin", mins: 8, status: "done" },
    { id: "s3", title: "Heat vs. batteries", mins: 12, status: "live" },
    { id: "s4", title: "The $2,500 rebate, not the rumor", mins: 7, status: "next" },
    { id: "s5", title: "Listener voicemail: home charging", mins: 8, status: "queued" },
    { id: "s6", title: "Close + next week tease", mins: 4, status: "queued" },
  ],
};
