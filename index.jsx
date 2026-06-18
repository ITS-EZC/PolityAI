import React, { useState, useMemo } from "react";

/* ============================================================
   PolityAI — MVP
   - The Bill Explainer is LIVE: it calls Claude to translate
     real legislative text into plain English (nonpartisan).
   - Representatives, votes, and feed use clearly-labeled
     SAMPLE DATA (an artifact can't reach Congress.gov live).
   ============================================================ */

const C = {
  ink: "#16202E",
  ink2: "#384556",
  paper: "#F4F5F1",
  surface: "#FFFFFF",
  patina: "#2D7A6B",   // primary civic accent (copper patina)
  patinaDk: "#1F5B4F",
  amber: "#BD7A2A",    // attention / alerts
  yea: "#2F7D6E",
  nay: "#B05B3D",
  muted: "#626C7A",
  hair: "#E2E4DE",
};

const TOPICS = [
  "Healthcare", "Climate & Environment", "Economy & Taxes",
  "Privacy & Technology", "Education", "Housing",
];

/* ---------- SAMPLE DATA (illustrative, not real records) ---------- */

const REPS = [
  { id: "r1", name: "Rep. Jordan Avery", role: "U.S. House — District 12", party: "Democratic", initials: "JA" },
  { id: "r2", name: "Sen. Maria Castillo", role: "U.S. Senate", party: "Republican", initials: "MC" },
  { id: "r3", name: "Sen. Thomas Reed", role: "U.S. Senate", party: "Democratic", initials: "TR" },
];

const BILLS = [
  {
    id: "HR 2034",
    title: "Prescription Drug Price Transparency Act",
    topics: ["Healthcare"],
    gloss: "Forces drugmakers to explain and justify big price hikes before they take effect.",
    source:
      "A BILL — To require manufacturers of prescription pharmaceutical products to disclose wholesale acquisition cost adjustments. SEC. 2. DISCLOSURE REQUIREMENT. (a) IN GENERAL.—Not later than 30 days prior to any increase in the wholesale acquisition cost of a covered drug exceeding 10 percent over a rolling 12-month period, the manufacturer shall submit to the Secretary a report containing the justification therefor, itemized research and development expenditures attributable to such drug, and net revenue derived therefrom in the preceding fiscal year. (b) PUBLICATION.—The Secretary shall make each report available to the public in a searchable electronic format. SEC. 3. ENFORCEMENT.—A manufacturer failing to comply shall be subject to a civil monetary penalty not to exceed $100,000 per violation.",
    tally: { yea: 231, nay: 198 },
    votes: { r1: "Yea", r2: "Nay", r3: "Yea" },
    date: "2026-05-21",
  },
  {
    id: "S 871",
    title: "Consumer Data Privacy & Protection Act",
    topics: ["Privacy & Technology"],
    gloss: "Lets you see, delete, and stop the sale of the personal data companies collect on you.",
    source:
      "A BILL — To establish requirements for the collection, processing, and transfer of covered personal data. SEC. 101. CONSUMER RIGHTS. A covered entity shall, upon verified request, (1) disclose the categories of personal data collected and the third parties to whom such data has been transferred; (2) delete personal data pertaining to the individual; and (3) cease the sale of such data to third parties. SEC. 102. DATA MINIMIZATION. A covered entity shall limit collection of personal data to what is reasonably necessary to provide the requested service. SEC. 201. ENFORCEMENT. The Commission shall treat a violation as an unfair or deceptive act under section 5 of the Federal Trade Commission Act.",
    tally: { yea: 61, nay: 38 },
    votes: { r1: "Yea", r2: "Yea", r3: "Yea" },
    date: "2026-05-14",
  },
  {
    id: "HR 559",
    title: "Wildfire Resilience & Community Protection Fund",
    topics: ["Climate & Environment", "Housing"],
    gloss: "Creates a fund to clear fire-prone brush and harden homes in high-risk communities.",
    source:
      "A BILL — To establish a fund for wildfire mitigation and community resilience. SEC. 2. ESTABLISHMENT OF FUND. There is established in the Treasury a Wildfire Resilience Fund, to remain available until expended. SEC. 3. ELIGIBLE ACTIVITIES. Amounts may be awarded to States, Tribes, and local governments for (1) hazardous fuels reduction on lands adjacent to the wildland-urban interface; (2) defensible-space and home-hardening grants to residents in high-hazard zones; and (3) establishment of community evacuation infrastructure. SEC. 4. AUTHORIZATION. There is authorized to be appropriated $2,500,000,000 for each of fiscal years 2027 through 2031.",
    tally: { yea: 248, nay: 181 },
    votes: { r1: "Yea", r2: "Nay", r3: "Yea" },
    date: "2026-04-30",
  },
  {
    id: "S 1290",
    title: "Government AI Transparency Act",
    topics: ["Privacy & Technology"],
    gloss: "Requires federal agencies to disclose when they use AI to make decisions about you.",
    source:
      "A BILL — To require transparency in the use of automated decision systems by Federal agencies. SEC. 2. INVENTORY. Each agency shall maintain and publish an inventory of automated decision systems used to make or substantially inform decisions affecting the rights or benefits of individuals. SEC. 3. NOTICE. An agency employing such a system in an adverse determination shall provide the affected individual notice of such use and a plain-language description of the principal factors. SEC. 4. APPEAL. Each agency shall establish a process by which an individual may contest a determination substantially informed by an automated decision system and obtain human review.",
    tally: { yea: 67, nay: 32 },
    votes: { r1: "Yea", r2: "Yea", r3: "Nay" },
    date: "2026-04-18",
  },
  {
    id: "HR 1102",
    title: "Main Street Small Business Tax Relief Act",
    topics: ["Economy & Taxes"],
    gloss: "Raises the instant write-off limit small businesses can take on new equipment.",
    source:
      "A BILL — To amend the Internal Revenue Code to increase expensing limits for small business. SEC. 2. INCREASED LIMITATION. Section 179(b)(1) is amended by increasing the dollar limitation on the amount a taxpayer may elect to treat as an expense to $2,000,000, with the phase-out threshold increased to $4,000,000. SEC. 3. INFLATION ADJUSTMENT. The dollar amounts shall be adjusted annually for inflation. SEC. 4. EFFECTIVE DATE. The amendments shall apply to property placed in service in taxable years beginning after December 31, 2026.",
    tally: { yea: 274, nay: 155 },
    votes: { r1: "Nay", r2: "Yea", r3: "Nay" },
    date: "2026-04-09",
  },
  {
    id: "HR 740",
    title: "School Modernization & Repair Grants Act",
    topics: ["Education"],
    gloss: "Sends grants to school districts to fix aging buildings, HVAC, and broadband.",
    source:
      "A BILL — To provide grants for the modernization and repair of public school facilities. SEC. 2. GRANT PROGRAM. The Secretary shall award grants to local educational agencies for (1) repair or replacement of roofing, plumbing, and HVAC systems; (2) remediation of hazardous building conditions; and (3) installation of high-speed broadband infrastructure. SEC. 3. PRIORITY. In awarding grants, the Secretary shall give priority to high-need local educational agencies serving a high percentage of students eligible for free or reduced-price lunch. SEC. 4. AUTHORIZATION. There is authorized $10,000,000,000 over five fiscal years.",
    tally: { yea: 219, nay: 210 },
    votes: { r1: "Yea", r2: "Nay", r3: "Yea" },
    date: "2026-03-26",
  },
];

/* ---------- helpers ---------- */

function daysAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = Math.round((Date.now() - d.getTime()) / 86400000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 30) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function explainBill(billText, interests) {
  const interestStr = interests.length ? interests.join(", ") : "none specified";
  const prompt =
`Legislative text to explain (it may be dense or partial — explain only what is present):
"""
${billText}
"""

The reader cares about these issues: ${interestStr}.

Return ONLY a JSON object — no markdown, no backticks, no preamble — with exactly these keys:
{
 "tldr": "1-2 plain sentences a 9th grader understands",
 "whatItDoes": ["2-4 short plain bullets describing the actual provisions"],
 "whoIsAffected": ["2-3 short bullets naming who this touches"],
 "argumentsFor": ["2-3 fair points supporters would make"],
 "argumentsAgainst": ["2-3 fair points opponents would make"],
 "jargonBuster": [{"term":"a legal or procedural term from the text","plain":"its plain meaning"}],
 "relevanceToYou": "1 sentence connecting this to the reader's issues, or null if none clearly apply"
}
Rules: strictly nonpartisan and balanced; never advocate. Ground every point in the provided text and do not invent provisions. Keep each string under 30 words. Provide 2-3 jargonBuster items.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        "You are PolityAI, a strictly nonpartisan civic explainer that turns legislation into plain English. You present multiple sides fairly, never advocate, and output only valid JSON.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(clean);
}

/* ---------- small components ---------- */

function VoteBadge({ vote }) {
  const yea = vote === "Yea";
  return (
    <span
      className="pa-votebadge"
      style={{
        color: yea ? C.yea : C.nay,
        borderColor: yea ? C.yea : C.nay,
        background: yea ? "rgba(47,125,110,.08)" : "rgba(176,91,61,.08)",
      }}
    >
      {yea ? "Voted Yea" : "Voted Nay"}
    </span>
  );
}

function Spinner() {
  return <span className="pa-spinner" aria-hidden="true" />;
}

function RepCard({ rep, followed, onToggle }) {
  return (
    <div className="pa-repcard">
      <div className="pa-avatar" aria-hidden="true">{rep.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="pa-repname">{rep.name}</div>
        <div className="pa-repmeta">{rep.role} · {rep.party}</div>
      </div>
      <button
        className={followed ? "pa-btn-sm pa-following" : "pa-btn-sm"}
        onClick={() => onToggle(rep.id)}
      >
        {followed ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function VoteRow({ bill, repId }) {
  const v = repId ? bill.votes[repId] : null;
  return (
    <div className="pa-voterow">
      <div className="pa-voterow-head">
        <span className="pa-billid">{bill.id}</span>
        <span className="pa-voterow-date">{daysAgo(bill.date)}</span>
      </div>
      <div className="pa-voterow-title">{bill.title}</div>
      <div className="pa-voterow-gloss">{bill.gloss}</div>
      <div className="pa-voterow-foot">
        {v && <VoteBadge vote={v} />}
        <span className="pa-tally">
          Passed {bill.tally.yea}&ndash;{bill.tally.nay}
        </span>
        <span className="pa-topics">
          {bill.topics.map((t) => (
            <span key={t} className="pa-topicpill">{t}</span>
          ))}
        </span>
      </div>
    </div>
  );
}

/* ---------- main app ---------- */

export default function PolityAI() {
  const [tab, setTab] = useState("feed");
  const [interests, setInterests] = useState(["Healthcare", "Privacy & Technology"]);
  const [followed, setFollowed] = useState(["r1"]);
  const [addressShown, setAddressShown] = useState(true);
  const [addr, setAddr] = useState("");

  // explainer state
  const [activeBill, setActiveBill] = useState(BILLS[0].id);
  const [pasted, setPasted] = useState("");
  const [usePasted, setUsePasted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const toggle = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const sourceText = usePasted
    ? pasted
    : BILLS.find((b) => b.id === activeBill)?.source || "";

  const feedBills = useMemo(() => {
    return BILLS.filter((b) => b.topics.some((t) => interests.includes(t)));
  }, [interests]);

  const alertBills = useMemo(() => {
    return BILLS.filter(
      (b) =>
        b.topics.some((t) => interests.includes(t)) &&
        followed.some((rid) => b.votes[rid])
    );
  }, [interests, followed]);

  async function runExplain() {
    setErr(null);
    setResult(null);
    if (!sourceText.trim()) {
      setErr("Add some bill text first, or pick a sample bill.");
      return;
    }
    setLoading(true);
    try {
      const r = await explainBill(sourceText, interests);
      setResult(r);
    } catch (e) {
      setErr("Couldn't generate a plain-English version just now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const NAV = [
    { id: "feed", label: "Your feed" },
    { id: "explain", label: "Explain a bill" },
    { id: "reps", label: "My representatives" },
    { id: "alerts", label: "Alerts" },
  ];

  return (
    <div className="pa-root">
      <style>{CSS}</style>

      {/* top bar */}
      <header className="pa-topbar">
        <div className="pa-brand">
          <span className="pa-mark" aria-hidden="true">◑</span>
          <span className="pa-wordmark">PolityAI</span>
        </div>
        <span className="pa-tagline">The public record, in plain English.</span>
        <span className="pa-demo">Demo &middot; sample records</span>
      </header>

      {/* nav */}
      <nav className="pa-nav" aria-label="Sections">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={tab === n.id ? "pa-navbtn pa-navbtn-on" : "pa-navbtn"}
            onClick={() => setTab(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <main className="pa-main">
        {/* ---------------- FEED ---------------- */}
        {tab === "feed" && (
          <section>
            <h1 className="pa-h1">What your government did lately</h1>
            <p className="pa-sub">
              Recent votes touching the issues you follow. Pick what you care about and the feed reshapes itself.
            </p>

            <div className="pa-chiprow">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  className={interests.includes(t) ? "pa-chip pa-chip-on" : "pa-chip"}
                  onClick={() => toggle(interests, setInterests, t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {feedBills.length === 0 ? (
              <div className="pa-empty">Choose at least one issue above to build your feed.</div>
            ) : (
              <div className="pa-grid">
                {feedBills.map((b) => (
                  <div key={b.id} className="pa-card">
                    <VoteRow bill={b} repId={null} />
                    <button
                      className="pa-btn-link"
                      onClick={() => {
                        setUsePasted(false);
                        setActiveBill(b.id);
                        setResult(null);
                        setErr(null);
                        setTab("explain");
                      }}
                    >
                      Explain this bill →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ---------------- EXPLAIN ---------------- */}
        {tab === "explain" && (
          <section>
            <h1 className="pa-h1">Explain a bill</h1>
            <p className="pa-sub">
              Pick a sample bill or paste any legislative text. We turn the legal language into something a person can read.
              <strong> This part is live AI.</strong>
            </p>

            <div className="pa-pickrow">
              {BILLS.map((b) => (
                <button
                  key={b.id}
                  className={
                    !usePasted && activeBill === b.id ? "pa-pick pa-pick-on" : "pa-pick"
                  }
                  onClick={() => {
                    setUsePasted(false);
                    setActiveBill(b.id);
                    setResult(null);
                    setErr(null);
                  }}
                >
                  <span className="pa-billid">{b.id}</span>
                  <span className="pa-pick-title">{b.title}</span>
                </button>
              ))}
              <button
                className={usePasted ? "pa-pick pa-pick-on" : "pa-pick"}
                onClick={() => {
                  setUsePasted(true);
                  setResult(null);
                  setErr(null);
                }}
              >
                <span className="pa-billid">PASTE</span>
                <span className="pa-pick-title">Your own text</span>
              </button>
            </div>

            <div className="pa-translate">
              {/* source side */}
              <div className="pa-pane pa-pane-source">
                <div className="pa-pane-label">As written</div>
                {usePasted ? (
                  <textarea
                    className="pa-textarea"
                    placeholder="Paste bill text, a section, or a summary here…"
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                  />
                ) : (
                  <p className="pa-sourcetext">{sourceText}</p>
                )}
                <button className="pa-btn-primary" onClick={runExplain} disabled={loading}>
                  {loading ? <><Spinner /> Translating…</> : "Translate to plain English"}
                </button>
              </div>

              {/* arrow */}
              <div className="pa-arrow" aria-hidden="true">→</div>

              {/* plain side */}
              <div className="pa-pane pa-pane-plain">
                <div className="pa-pane-label" style={{ color: C.patinaDk }}>In plain English</div>

                {!result && !loading && !err && (
                  <div className="pa-placeholder">
                    Your plain-English breakdown will appear here — what it does, who it affects, and the case on each side.
                  </div>
                )}
                {err && <div className="pa-error">{err}</div>}
                {loading && (
                  <div className="pa-loadblock">
                    <div className="pa-shimmer" /><div className="pa-shimmer" style={{ width: "80%" }} />
                    <div className="pa-shimmer" style={{ width: "90%" }} />
                  </div>
                )}

                {result && (
                  <div className="pa-result">
                    <div className="pa-tldr">{result.tldr}</div>

                    <Block title="What it does" items={result.whatItDoes} />
                    <Block title="Who it affects" items={result.whoIsAffected} />

                    <div className="pa-twocol">
                      <div className="pa-forcol">
                        <div className="pa-blocktitle" style={{ color: C.yea }}>The case for</div>
                        <ul className="pa-list">
                          {(result.argumentsFor || []).map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                      <div className="pa-againstcol">
                        <div className="pa-blocktitle" style={{ color: C.nay }}>The case against</div>
                        <ul className="pa-list">
                          {(result.argumentsAgainst || []).map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    </div>

                    {result.jargonBuster && result.jargonBuster.length > 0 && (
                      <div className="pa-jargon">
                        <div className="pa-blocktitle">Jargon, decoded</div>
                        {result.jargonBuster.map((j, i) => (
                          <div key={i} className="pa-jargonrow">
                            <span className="pa-jargonterm">{j.term}</span>
                            <span className="pa-jargonplain">{j.plain}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.relevanceToYou && (
                      <div className="pa-relevance">
                        <span className="pa-reltag">Why this matters to you</span>
                        {result.relevanceToYou}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ---------------- REPS ---------------- */}
        {tab === "reps" && (
          <section>
            <h1 className="pa-h1">Find your representatives</h1>
            <p className="pa-sub">Type where you live — no need to know your district. We map it for you.</p>

            <div className="pa-addrrow">
              <input
                className="pa-input"
                placeholder="Street address or ZIP code"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
              />
              <button className="pa-btn-primary" onClick={() => setAddressShown(true)}>
                Find them
              </button>
            </div>

            {addressShown && (
              <>
                <div className="pa-note">Showing sample representatives for this demo.</div>
                <div className="pa-replist">
                  {REPS.map((r) => (
                    <RepCard
                      key={r.id}
                      rep={r}
                      followed={followed.includes(r.id)}
                      onToggle={(id) => toggle(followed, setFollowed, id)}
                    />
                  ))}
                </div>

                {followed.map((rid) => {
                  const rep = REPS.find((r) => r.id === rid);
                  const theirVotes = BILLS.filter((b) => b.votes[rid]);
                  return (
                    <div key={rid} className="pa-reprecord">
                      <h2 className="pa-h2">{rep.name} — recent votes</h2>
                      <div className="pa-grid">
                        {theirVotes.map((b) => (
                          <div key={b.id} className="pa-card">
                            <VoteRow bill={b} repId={rid} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}

        {/* ---------------- ALERTS ---------------- */}
        {tab === "alerts" && (
          <section>
            <h1 className="pa-h1">Alerts</h1>
            <p className="pa-sub">
              We watch the reps you follow and ping you when they vote on issues you care about — so you never have to go looking.
            </p>

            <div className="pa-setup">
              <div className="pa-setupcol">
                <div className="pa-setuplabel">Issues you're watching</div>
                <div className="pa-chiprow">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      className={interests.includes(t) ? "pa-chip pa-chip-on" : "pa-chip"}
                      onClick={() => toggle(interests, setInterests, t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pa-setupcol">
                <div className="pa-setuplabel">Representatives you follow</div>
                <div className="pa-replist">
                  {REPS.map((r) => (
                    <RepCard
                      key={r.id}
                      rep={r}
                      followed={followed.includes(r.id)}
                      onToggle={(id) => toggle(followed, setFollowed, id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <h2 className="pa-h2">Recent alerts</h2>
            {alertBills.length === 0 ? (
              <div className="pa-empty">
                Follow at least one representative and one issue to start getting alerts.
              </div>
            ) : (
              <div className="pa-alertlist">
                {alertBills.map((b) => {
                  const who = followed
                    .filter((rid) => b.votes[rid])
                    .map((rid) => REPS.find((r) => r.id === rid).name);
                  return (
                    <div key={b.id} className="pa-alert">
                      <span className="pa-alertdot" style={{ background: C.amber }} aria-hidden="true" />
                      <div>
                        <div className="pa-alerthead">
                          {who.join(" & ")} voted on {b.id}
                          <span className="pa-alerttime">{daysAgo(b.date)}</span>
                        </div>
                        <div className="pa-voterow-title" style={{ marginTop: 2 }}>{b.title}</div>
                        <div className="pa-voterow-gloss">{b.gloss}</div>
                        <div className="pa-alertfoot">
                          {followed
                            .filter((rid) => b.votes[rid])
                            .map((rid) => (
                              <span key={rid} className="pa-alertvote">
                                {REPS.find((r) => r.id === rid).initials}: <VoteBadge vote={b.votes[rid]} />
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pa-howcard">
              In the full product these arrive by email or push the moment a vote is recorded — pulled live from the
              Congress.gov API and roll-call records, not a feed you have to check.
            </div>
          </section>
        )}
      </main>

      <footer className="pa-footer">
        Representatives, votes, and tallies shown are illustrative sample data. The bill explainer is powered by live AI.
        PolityAI is nonpartisan and presents multiple sides.
      </footer>
    </div>
  );
}

function Block({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="pa-block">
      <div className="pa-blocktitle">{title}</div>
      <ul className="pa-list">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}

/* ---------- styles ---------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

.pa-root{
  --ink:${C.ink}; --paper:${C.paper}; --patina:${C.patina}; --hair:${C.hair}; --muted:${C.muted};
  background:${C.paper}; color:${C.ink};
  font-family:'Inter',system-ui,sans-serif; min-height:100%;
  -webkit-font-smoothing:antialiased; line-height:1.5;
}
.pa-root *{box-sizing:border-box;}

.pa-topbar{
  display:flex; align-items:center; gap:14px; flex-wrap:wrap;
  padding:16px 28px; border-bottom:1px solid ${C.hair}; background:${C.surface};
}
.pa-brand{display:flex; align-items:center; gap:9px;}
.pa-mark{color:${C.patina}; font-size:22px; line-height:1;}
.pa-wordmark{font-family:'Fraunces',serif; font-weight:600; font-size:21px; letter-spacing:-.01em;}
.pa-tagline{color:${C.muted}; font-size:13.5px; border-left:1px solid ${C.hair}; padding-left:14px;}
.pa-demo{
  margin-left:auto; font-family:'Space Mono',monospace; font-size:11px; letter-spacing:.04em;
  color:${C.amber}; border:1px solid ${C.amber}; border-radius:999px; padding:3px 10px;
  text-transform:uppercase;
}

.pa-nav{
  display:flex; gap:4px; padding:0 22px; border-bottom:1px solid ${C.hair};
  background:${C.surface}; overflow-x:auto;
}
.pa-navbtn{
  appearance:none; background:none; border:none; cursor:pointer;
  font-family:inherit; font-size:14.5px; color:${C.muted};
  padding:14px 14px; border-bottom:2px solid transparent; white-space:nowrap;
}
.pa-navbtn:hover{color:${C.ink};}
.pa-navbtn-on{color:${C.ink}; border-bottom-color:${C.patina}; font-weight:500;}

.pa-main{max-width:1040px; margin:0 auto; padding:30px 28px 40px;}

.pa-h1{font-family:'Fraunces',serif; font-weight:600; font-size:30px; letter-spacing:-.015em; margin:0 0 6px;}
.pa-h2{font-family:'Fraunces',serif; font-weight:500; font-size:21px; margin:28px 0 12px;}
.pa-sub{color:${C.muted}; font-size:15px; max-width:62ch; margin:0 0 20px;}
.pa-sub strong{color:${C.patinaDk}; font-weight:600;}

.pa-chiprow{display:flex; flex-wrap:wrap; gap:8px; margin-bottom:22px;}
.pa-chip{
  appearance:none; cursor:pointer; font-family:inherit; font-size:13.5px;
  border:1px solid ${C.hair}; background:${C.surface}; color:${C.ink2};
  border-radius:999px; padding:7px 14px; transition:.12s;
}
.pa-chip:hover{border-color:${C.patina};}
.pa-chip-on{background:${C.patina}; border-color:${C.patina}; color:#fff; font-weight:500;}

.pa-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:14px;}
.pa-card{
  background:${C.surface}; border:1px solid ${C.hair}; border-radius:12px;
  padding:16px 17px; display:flex; flex-direction:column;
}
.pa-empty{
  background:${C.surface}; border:1px dashed ${C.hair}; border-radius:12px;
  padding:26px; color:${C.muted}; text-align:center; font-size:14.5px;
}

.pa-voterow-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;}
.pa-billid{font-family:'Space Mono',monospace; font-size:12px; font-weight:700; color:${C.patinaDk}; letter-spacing:.02em;}
.pa-voterow-date{font-size:12px; color:${C.muted};}
.pa-voterow-title{font-family:'Fraunces',serif; font-size:16.5px; font-weight:500; line-height:1.3;}
.pa-voterow-gloss{color:${C.ink2}; font-size:14px; margin-top:6px;}
.pa-voterow-foot{display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:12px;}
.pa-tally{font-family:'Space Mono',monospace; font-size:11.5px; color:${C.muted};}
.pa-topics{display:flex; gap:6px; flex-wrap:wrap; margin-left:auto;}
.pa-topicpill{font-size:11px; color:${C.muted}; background:${C.paper}; border:1px solid ${C.hair}; border-radius:999px; padding:2px 9px;}

.pa-votebadge{font-size:11.5px; font-weight:600; border:1px solid; border-radius:999px; padding:2px 9px;}

.pa-btn-link{
  appearance:none; background:none; border:none; cursor:pointer; font-family:inherit;
  color:${C.patinaDk}; font-size:13.5px; font-weight:500; padding:10px 0 0; text-align:left;
}
.pa-btn-link:hover{text-decoration:underline;}

/* explainer */
.pa-pickrow{display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px;}
.pa-pick{
  appearance:none; cursor:pointer; font-family:inherit; text-align:left;
  background:${C.surface}; border:1px solid ${C.hair}; border-radius:10px;
  padding:9px 12px; display:flex; flex-direction:column; gap:2px; max-width:200px; transition:.12s;
}
.pa-pick:hover{border-color:${C.patina};}
.pa-pick-on{border-color:${C.patina}; box-shadow:0 0 0 1px ${C.patina} inset;}
.pa-pick-title{font-size:12.5px; color:${C.ink2}; line-height:1.25;}

.pa-translate{display:grid; grid-template-columns:1fr auto 1.15fr; gap:14px; align-items:stretch;}
.pa-pane{background:${C.surface}; border:1px solid ${C.hair}; border-radius:14px; padding:18px; display:flex; flex-direction:column;}
.pa-pane-source{background:#FBFBF9;}
.pa-pane-plain{border-color:${C.patina}; box-shadow:0 1px 0 ${C.hair};}
.pa-pane-label{
  font-family:'Space Mono',monospace; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase;
  color:${C.muted}; margin-bottom:12px;
}
.pa-sourcetext{
  font-family:'Space Mono',monospace; font-size:12.5px; line-height:1.65; color:${C.ink2};
  flex:1; margin:0 0 14px; white-space:pre-wrap;
}
.pa-textarea{
  flex:1; min-height:220px; resize:vertical; font-family:'Space Mono',monospace; font-size:12.5px;
  line-height:1.6; color:${C.ink}; border:1px solid ${C.hair}; border-radius:8px; padding:11px; margin-bottom:14px;
  background:#fff;
}
.pa-textarea:focus{outline:2px solid ${C.patina}; outline-offset:1px;}
.pa-arrow{align-self:center; color:${C.patina}; font-size:24px;}

.pa-placeholder{color:${C.muted}; font-size:14px; line-height:1.6; padding:20px 0;}
.pa-error{color:${C.nay}; font-size:14px; background:rgba(176,91,61,.07); border:1px solid ${C.nay}; border-radius:8px; padding:12px;}

.pa-tldr{font-family:'Fraunces',serif; font-size:18px; line-height:1.4; margin-bottom:18px; color:${C.ink};}
.pa-block{margin-bottom:16px;}
.pa-blocktitle{font-size:12px; font-weight:600; letter-spacing:.02em; text-transform:uppercase; color:${C.muted}; margin-bottom:7px;}
.pa-list{margin:0; padding-left:18px;}
.pa-list li{font-size:14px; line-height:1.5; margin-bottom:5px; color:${C.ink2};}
.pa-twocol{display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:6px 0 16px; padding:14px; background:${C.paper}; border-radius:10px;}
.pa-jargon{border-top:1px solid ${C.hair}; padding-top:14px; margin-bottom:14px;}
.pa-jargonrow{display:flex; gap:10px; margin-bottom:7px; align-items:baseline;}
.pa-jargonterm{font-family:'Space Mono',monospace; font-size:12px; color:${C.patinaDk}; min-width:120px; flex-shrink:0;}
.pa-jargonplain{font-size:13.5px; color:${C.ink2};}
.pa-relevance{
  background:rgba(45,122,107,.08); border:1px solid ${C.patina}; border-radius:10px; padding:13px 14px;
  font-size:14px; color:${C.ink}; line-height:1.5;
}
.pa-reltag{display:block; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.03em; color:${C.patinaDk}; margin-bottom:4px;}

/* buttons */
.pa-btn-primary{
  appearance:none; cursor:pointer; font-family:inherit; font-size:14px; font-weight:500;
  background:${C.patina}; color:#fff; border:none; border-radius:9px; padding:11px 18px;
  display:inline-flex; align-items:center; gap:8px; justify-content:center; transition:.12s;
}
.pa-btn-primary:hover{background:${C.patinaDk};}
.pa-btn-primary:disabled{opacity:.6; cursor:default;}
.pa-btn-sm{
  appearance:none; cursor:pointer; font-family:inherit; font-size:13px; font-weight:500;
  background:${C.surface}; color:${C.patinaDk}; border:1px solid ${C.patina}; border-radius:8px; padding:6px 14px;
}
.pa-btn-sm:hover{background:rgba(45,122,107,.07);}
.pa-following{background:${C.patina}; color:#fff;}

.pa-spinner{
  width:14px; height:14px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff;
  border-radius:50%; display:inline-block; animation:pa-spin .7s linear infinite;
}
@keyframes pa-spin{to{transform:rotate(360deg);}}
.pa-loadblock{display:flex; flex-direction:column; gap:10px; padding-top:8px;}
.pa-shimmer{height:13px; border-radius:6px; background:linear-gradient(90deg,${C.hair},#f0f1ec,${C.hair}); background-size:200% 100%; animation:pa-sh 1.2s infinite;}
@keyframes pa-sh{0%{background-position:200% 0;}100%{background-position:-200% 0;}}

/* reps */
.pa-addrrow{display:flex; gap:10px; margin-bottom:14px; max-width:520px;}
.pa-input{
  flex:1; font-family:inherit; font-size:14px; border:1px solid ${C.hair}; border-radius:9px;
  padding:11px 13px; background:#fff; color:${C.ink};
}
.pa-input:focus{outline:2px solid ${C.patina}; outline-offset:1px;}
.pa-note{font-size:12.5px; color:${C.muted}; margin-bottom:16px; font-style:italic;}
.pa-replist{display:flex; flex-direction:column; gap:10px; margin-bottom:8px;}
.pa-repcard{display:flex; align-items:center; gap:13px; background:${C.surface}; border:1px solid ${C.hair}; border-radius:12px; padding:13px 15px;}
.pa-avatar{
  width:40px; height:40px; border-radius:50%; background:${C.ink}; color:#fff; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-family:'Fraunces',serif; font-size:15px; font-weight:600;
}
.pa-repname{font-weight:600; font-size:15px;}
.pa-repmeta{font-size:13px; color:${C.muted}; margin-top:1px;}
.pa-reprecord{margin-top:6px;}

/* alerts */
.pa-setup{display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:8px;}
.pa-setuplabel{font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.02em; color:${C.muted}; margin-bottom:11px;}
.pa-alertlist{display:flex; flex-direction:column; gap:11px;}
.pa-alert{display:flex; gap:13px; background:${C.surface}; border:1px solid ${C.hair}; border-left:3px solid ${C.amber}; border-radius:10px; padding:14px 16px;}
.pa-alertdot{width:9px; height:9px; border-radius:50%; flex-shrink:0; margin-top:6px;}
.pa-alerthead{font-size:14px; font-weight:600; display:flex; gap:10px; align-items:baseline;}
.pa-alerttime{font-size:12px; color:${C.muted}; font-weight:400;}
.pa-alertfoot{display:flex; gap:14px; flex-wrap:wrap; margin-top:9px;}
.pa-alertvote{font-size:12px; color:${C.muted}; display:flex; align-items:center; gap:6px; font-family:'Space Mono',monospace;}
.pa-howcard{margin-top:18px; background:${C.paper}; border:1px solid ${C.hair}; border-radius:10px; padding:15px 16px; font-size:13.5px; color:${C.ink2}; line-height:1.55;}

.pa-footer{
  max-width:1040px; margin:0 auto; padding:20px 28px 36px; border-top:1px solid ${C.hair};
  font-size:12px; color:${C.muted}; line-height:1.5;
}

@media (max-width:820px){
  .pa-grid{grid-template-columns:1fr;}
  .pa-translate{grid-template-columns:1fr;}
  .pa-arrow{transform:rotate(90deg); justify-self:center;}
  .pa-setup{grid-template-columns:1fr;}
  .pa-twocol{grid-template-columns:1fr;}
  .pa-tagline{display:none;}
  .pa-main{padding:24px 18px 36px;}
}

@media (prefers-reduced-motion:reduce){
  .pa-spinner,.pa-shimmer{animation:none;}
}
`;
