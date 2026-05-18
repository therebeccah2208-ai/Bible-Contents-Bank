import { useState } from "react";

// ─────────────────────────────────────────────────────────────
//  CONFIGURATION
//  When deploying, set your Anthropic API key in your hosting
//  platform's environment variables as: VITE_ANTHROPIC_API_KEY
//  e.g. on Vercel → Project Settings → Environment Variables
// ─────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

const CHARACTERS = [
  "Moses", "David", "Joseph", "Elijah", "Samson", "Solomon", "Abraham", "Daniel",
  "Gideon", "Jonah", "Job", "Isaiah", "Jeremiah", "Joshua", "Esther", "Ruth",
  "Mary Magdalene", "Paul", "Peter", "John the Baptist", "Lazarus", "Nicodemus",
  "Mary (Mother of Jesus)", "Martha", "Rahab", "Deborah", "Saul / King Saul",
  "Jezebel", "Judas Iscariot", "Thomas", "Barnabas", "Stephen", "Lydia",
  "Zacchaeus", "Goliath", "Herod", "Pilate", "Eve", "Adam",
  "Cain", "Noah", "Jacob", "Leah", "Rachel", "Miriam", "Aaron", "Caleb"
];

const SECTION_ICONS = { titles: "🎬", thumbnails: "🖼️", description: "📄", script: "📝" };
const SECTION_LABELS = {
  titles: "Title & Hook Ideas",
  thumbnails: "Thumbnail Text Ideas",
  description: "YouTube Description & Tags",
  script: "Video Script"
};

function getPrompt(section, character) {
  const p = {
    titles: `You are a YouTube content strategist for a faceless Bible storytelling channel. 
Generate 6 compelling video title and hook ideas for a video about the Bible character: ${character}.
Mix styles: dramatic storytelling, educational, devotional, and inspirational.
Format each as:
TITLE: [title]
HOOK: [1-2 sentence opening hook for the video]
---
Make titles attention-grabbing, SEO-friendly, and suited for YouTube. Use power words. No generic titles.`,

    thumbnails: `You are a YouTube thumbnail designer and copywriter for a faceless Bible channel.
Create 5 thumbnail text concepts for a video about: ${character}.
Each concept should include:
MAIN TEXT: [bold 2-4 word phrase]
SUB TEXT: [supporting 3-6 word phrase]
VISUAL CONCEPT: [brief description of background/visual style]
EMOTION: [what emotion this should evoke]
---
Make them dramatic, intriguing, and click-worthy. Bible aesthetic.`,

    description: `You are a YouTube SEO expert for a Bible storytelling channel.
Write a full YouTube video description AND tags for a video about: ${character}.

Include:
1. A compelling 3-paragraph description (dramatic, devotional, educational tone mix)
2. Call to action
3. 25 relevant hashtags and keywords as tags

Format clearly with sections labeled: DESCRIPTION and TAGS`,

    script: `You are a scriptwriter for a popular faceless YouTube Bible channel with a dramatic, educational, and devotional mixed style.
Write a full 5-7 minute video script about the Bible character: ${character}.

Structure:
[HOOK] - 30 second dramatic opening
[INTRO] - Brief channel intro
[BACKGROUND] - Historical/biblical context
[STORY] - The main narrative (dramatic storytelling)
[KEY LESSONS] - 3 spiritual/life lessons from their story
[REFLECTION] - Devotional closing thought
[OUTRO] - Call to action

Use vivid language, rhetorical questions, and varied pacing. Write for voiceover narration.`
  };
  return p[section];
}

export default function BibleContentBank() {
  const [apiKey, setApiKey] = useState(API_KEY);
  const [showKeyInput, setShowKeyInput] = useState(!API_KEY);
  const [character, setCharacter] = useState("");
  const [customCharacter, setCustomCharacter] = useState("");
  const [activeSection, setActiveSection] = useState("titles");
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const finalCharacter = customCharacter.trim() || character;
  const filteredChars = CHARACTERS.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const callAPI = async (section) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: getPrompt(section, finalCharacter) }]
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || "API error");
    }
    const data = await res.json();
    return data.content?.map(b => b.text || "").join("\n") || "";
  };

  const generateSection = async (section) => {
    if (!finalCharacter || !apiKey) return;
    setError("");
    setLoadingSection(section);
    setLoading(true);
    try {
      const text = await callAPI(section);
      setContent(prev => ({ ...prev, [section]: text }));
      setActiveSection(section);
    } catch (e) {
      setError(e.message);
      setContent(prev => ({ ...prev, [section]: "Error generating content. Check your API key." }));
    } finally {
      setLoading(false);
      setLoadingSection(null);
    }
  };

  const generateAll = async () => {
    if (!finalCharacter || !apiKey) return;
    setError("");
    setGenerated(true);
    setContent({});
    const sections = ["titles", "thumbnails", "description", "script"];
    for (const section of sections) {
      setLoadingSection(section);
      setLoading(true);
      try {
        const text = await callAPI(section);
        setContent(prev => ({ ...prev, [section]: text }));
        if (section === "titles") setActiveSection("titles");
      } catch (e) {
        setError(e.message);
        setContent(prev => ({ ...prev, [section]: "Error generating content." }));
      }
    }
    setLoading(false);
    setLoadingSection(null);
  };

  const copyContent = () => {
    if (content[activeSection]) {
      navigator.clipboard.writeText(content[activeSection]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c1d 0%, #1a1035 40%, #0d1f3c 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8d5a3"
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(212,175,55,0.3)",
        padding: "28px 40px 20px",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ fontSize: "34px" }}>✝️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#d4af37", letterSpacing: "1px", textTransform: "uppercase" }}>
                Bible Content Bank
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#a08060", letterSpacing: "2px" }}>
                AI-POWERED · FACELESS YOUTUBE · BIBLE CHARACTERS
              </p>
            </div>
          </div>
          <button onClick={() => setShowKeyInput(v => !v)}
            style={{
              padding: "8px 16px", background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.3)", borderRadius: "8px",
              color: "#d4af37", cursor: "pointer", fontSize: "12px", fontFamily: "Georgia,serif"
            }}>
            {apiKey ? "🔑 API Key Set ✓" : "🔑 Set API Key"}
          </button>
        </div>
      </div>

      {/* API Key Panel */}
      {showKeyInput && (
        <div style={{
          background: "rgba(212,175,55,0.08)", borderBottom: "1px solid rgba(212,175,55,0.2)",
          padding: "16px 40px"
        }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "280px" }}>
              <label style={{ fontSize: "10px", color: "#a08060", letterSpacing: "2px", display: "block", marginBottom: "6px" }}>
                ANTHROPIC API KEY — get yours at console.anthropic.com
              </label>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                style={{
                  width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: "8px", padding: "10px 14px", color: "#e8d5a3", fontSize: "14px",
                  fontFamily: "monospace", outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
            <button onClick={() => setShowKeyInput(false)}
              style={{
                padding: "10px 20px", marginTop: "18px",
                background: apiKey ? "linear-gradient(135deg,#d4af37,#b8860b)" : "rgba(100,80,30,0.3)",
                border: "none", borderRadius: "8px",
                color: apiKey ? "#0f0c1d" : "#6a5020",
                cursor: apiKey ? "pointer" : "not-allowed",
                fontSize: "13px", fontWeight: "bold", fontFamily: "Georgia,serif"
              }}>
              Save Key
            </button>
          </div>
          {error && (
            <p style={{ color: "#e57373", fontSize: "12px", margin: "8px 0 0", maxWidth: "1100px" }}>
              ⚠️ {error}
            </p>
          )}
        </div>
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 24px", display: "flex", gap: "28px", flexWrap: "wrap" }}>

        {/* SIDEBAR */}
        <div style={{ width: "270px", flexShrink: 0 }}>
          <div style={{
            background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: "12px", padding: "18px", marginBottom: "16px"
          }}>
            <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#a08060", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Custom Character
            </label>
            <input
              type="text"
              placeholder="e.g. Bathsheba, Ananias..."
              value={customCharacter}
              onChange={e => { setCustomCharacter(e.target.value); setCharacter(""); }}
              style={{
                width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: "8px", padding: "9px 12px", color: "#e8d5a3", fontSize: "14px",
                fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{
            background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: "12px", padding: "18px", marginBottom: "16px"
          }}>
            <label style={{ fontSize: "10px", letterSpacing: "2px", color: "#a08060", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Choose a Character
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "8px", padding: "7px 12px", color: "#e8d5a3", fontSize: "13px",
                fontFamily: "Georgia,serif", outline: "none", marginBottom: "10px", boxSizing: "border-box"
              }}
            />
            <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
              {filteredChars.map(c => (
                <button key={c} onClick={() => { setCharacter(c); setCustomCharacter(""); }}
                  style={{
                    background: character === c && !customCharacter ? "rgba(212,175,55,0.2)" : "transparent",
                    border: character === c && !customCharacter ? "1px solid rgba(212,175,55,0.5)" : "1px solid transparent",
                    borderRadius: "6px", padding: "7px 12px",
                    color: character === c && !customCharacter ? "#d4af37" : "#c0a070",
                    cursor: "pointer", textAlign: "left", fontSize: "13px",
                    fontFamily: "Georgia,serif", transition: "all 0.2s"
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {finalCharacter && (
            <div style={{
              background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "10px", padding: "12px 16px", marginBottom: "14px", textAlign: "center"
            }}>
              <div style={{ fontSize: "10px", color: "#a08060", letterSpacing: "2px", marginBottom: "4px" }}>SELECTED</div>
              <div style={{ fontSize: "18px", color: "#d4af37", fontWeight: "bold" }}>{finalCharacter}</div>
            </div>
          )}

          {!apiKey && (
            <div style={{
              background: "rgba(229,115,115,0.1)", border: "1px solid rgba(229,115,115,0.3)",
              borderRadius: "8px", padding: "10px 14px", marginBottom: "14px",
              fontSize: "12px", color: "#e57373", textAlign: "center"
            }}>
              ⚠️ Set your API key above to generate content
            </div>
          )}

          <button onClick={generateAll} disabled={!finalCharacter || !apiKey || loading}
            style={{
              width: "100%", padding: "13px",
              background: finalCharacter && apiKey && !loading ? "linear-gradient(135deg,#d4af37,#b8860b)" : "rgba(100,80,30,0.3)",
              border: "none", borderRadius: "10px",
              color: finalCharacter && apiKey && !loading ? "#0f0c1d" : "#6a5020",
              fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif",
              cursor: finalCharacter && apiKey && !loading ? "pointer" : "not-allowed",
              letterSpacing: "1px", transition: "all 0.3s"
            }}>
            {loading ? "✨ Generating..." : "⚡ Generate Full Bank"}
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: "300px" }}>
          {!generated ? (
            <div style={{
              textAlign: "center", padding: "80px 40px", color: "#6a5530",
              border: "1px dashed rgba(212,175,55,0.2)", borderRadius: "16px"
            }}>
              <div style={{ fontSize: "60px", marginBottom: "18px" }}>📖</div>
              <h2 style={{ color: "#a08060", fontSize: "20px", marginBottom: "10px" }}>Your Content Bank Awaits</h2>
              <p style={{ fontSize: "14px", lineHeight: "1.8", color: "#6a5030", maxWidth: "340px", margin: "0 auto" }}>
                {!apiKey
                  ? "Start by setting your Anthropic API key using the button in the top right."
                  : "Select a Bible character or type a custom name, then click Generate Full Bank."}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                {["titles", "thumbnails", "description", "script"].map(s => (
                  <button key={s} onClick={() => setActiveSection(s)}
                    style={{
                      padding: "9px 16px",
                      background: activeSection === s ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
                      border: activeSection === s ? "1px solid rgba(212,175,55,0.6)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      color: activeSection === s ? "#d4af37" : "#8a7050",
                      cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif",
                      display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s"
                    }}>
                    {SECTION_ICONS[s]} {SECTION_LABELS[s]}
                    {loadingSection === s && <span style={{ width: "6px", height: "6px", background: "#d4af37", borderRadius: "50%", animation: "pulse 1s infinite" }} />}
                    {content[s] && loadingSection !== s && <span style={{ color: "#4caf50", fontSize: "10px" }}>✓</span>}
                  </button>
                ))}
              </div>

              <div style={{
                background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "14px", padding: "26px", minHeight: "420px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h2 style={{ margin: 0, fontSize: "17px", color: "#d4af37", display: "flex", alignItems: "center", gap: "8px" }}>
                    {SECTION_ICONS[activeSection]} {SECTION_LABELS[activeSection]}
                    {finalCharacter && <span style={{ color: "#8a6a30", fontSize: "13px" }}>— {finalCharacter}</span>}
                  </h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => generateSection(activeSection)} disabled={!finalCharacter || !apiKey || loading}
                      style={{
                        padding: "6px 13px", background: "rgba(212,175,55,0.1)",
                        border: "1px solid rgba(212,175,55,0.3)", borderRadius: "6px",
                        color: "#d4af37", cursor: "pointer", fontSize: "12px", fontFamily: "Georgia,serif"
                      }}>🔄 Regenerate</button>
                    <button onClick={copyContent} disabled={!content[activeSection]}
                      style={{
                        padding: "6px 13px",
                        background: copied ? "rgba(76,175,80,0.2)" : "rgba(212,175,55,0.1)",
                        border: `1px solid ${copied ? "rgba(76,175,80,0.5)" : "rgba(212,175,55,0.3)"}`,
                        borderRadius: "6px", color: copied ? "#4caf50" : "#d4af37",
                        cursor: "pointer", fontSize: "12px", fontFamily: "Georgia,serif"
                      }}>{copied ? "✓ Copied!" : "📋 Copy"}</button>
                  </div>
                </div>

                {loadingSection === activeSection ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a7050" }}>
                    <div style={{ fontSize: "40px", marginBottom: "14px" }}>✨</div>
                    <p>Generating {SECTION_LABELS[activeSection]}...</p>
                  </div>
                ) : content[activeSection] ? (
                  <pre style={{
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    fontSize: "14px", lineHeight: "1.85", color: "#d4c090",
                    fontFamily: "Georgia,serif", margin: 0,
                    maxHeight: "520px", overflowY: "auto"
                  }}>{content[activeSection]}</pre>
                ) : (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#5a4020" }}>
                    <p style={{ fontSize: "14px" }}>Click a tab after generating to view content here.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:rgba(0,0,0,0.2)}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.3);border-radius:3px}
        input::placeholder{color:#5a4020}
      `}</style>
    </div>
  );
}
