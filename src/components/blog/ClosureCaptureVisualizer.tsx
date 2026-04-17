import { useState, useEffect } from "react";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import langSwift from "shiki/langs/swift.mjs";
import themeOneDarkPro from "shiki/themes/one-dark-pro.mjs";

// ─── SHIKI SETUP ───

const highlighter = createHighlighterCoreSync({
  themes: [themeOneDarkPro],
  langs: [langSwift],
  engine: createJavaScriptRegexEngine(),
});

// ─── TYPES ───

type Lang = "es" | "en";

interface StackVar {
  name: string;
  value: string;
  pointsTo?: string;
  color: string;
  faded?: boolean;
}

interface CaptureBox {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  vars: { name: string; value: string; highlight?: boolean }[];
  refCount: number;
}

interface Step {
  title: string;
  description: string;
  code: string;
  highlightLine?: number;
  stackVars: StackVar[];
  captureBoxes: CaptureBox[];
}

// ─── THEME ───

function useTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark
    ? {
        bg: "#18181b", surface: "#27272a", border: "rgba(255,255,255,0.08)",
        text: "#e4e4e7", textMuted: "#a1a1aa", textFaint: "#71717a",
        accentText: "#EC695B", badgeBg: "rgba(236,105,91,0.15)", badgeText: "#F59B90",
        activeBg: "#3f3f46", activeText: "#fff", btnBg: "#27272a", btnText: "#a1a1aa",
        btnBorder: "rgba(255,255,255,0.08)", slotBg: "rgba(255,255,255,0.06)",
        stackBg: "rgba(99,102,241,0.08)", heapBg: "rgba(6,182,212,0.08)",
        arrowColor: "#a1a1aa", highlightBg: "rgba(34,197,94,0.15)",
        highlightBorder: "#22c55e", highlightText: "#4ade80",
        refBg: "rgba(236,105,91,0.12)", refText: "#F59B90",
      }
    : {
        bg: "#fff", surface: "#F8F8F5", border: "rgba(0,0,0,0.06)",
        text: "#333", textMuted: "#666", textFaint: "#999",
        accentText: "#DC5648", badgeBg: "rgba(220,86,72,0.1)", badgeText: "#DC5648",
        activeBg: "#1a1a1a", activeText: "#fff", btnBg: "#f5f5f0", btnText: "#666",
        btnBorder: "rgba(0,0,0,0.08)", slotBg: "#fff",
        stackBg: "rgba(99,102,241,0.04)", heapBg: "rgba(6,182,212,0.04)",
        arrowColor: "#999", highlightBg: "rgba(34,197,94,0.06)",
        highlightBorder: "#22c55e", highlightText: "#16a34a",
        refBg: "rgba(220,86,72,0.06)", refText: "#DC5648",
      };
}

// ─── STEP DATA ───

function getSteps(l: boolean): Step[] {
  const indigo = "#6366f1";
  const cyan = "#06b6d4";
  const green = "#22c55e";
  const purple = "#8b5cf6";

  return [
    {
      title: l ? "Crear makeIncrementer" : "Create makeIncrementer",
      description: l
        ? "Se llama a makeIncrementer(forIncrement: 10). Las variables runningTotal y amount viven en el stack frame de la función. Todavía no hay nada en el heap."
        : "makeIncrementer(forIncrement: 10) is called. The variables runningTotal and amount live in the function's stack frame. Nothing on the heap yet.",
      code: `func makeIncrementer(forIncrement amount: Int) -> () -> Int {
    var runningTotal = 0       // ← stack
    func incrementer() -> Int {
        runningTotal += amount // captura runningTotal y amount
        return runningTotal
    }
    return incrementer
}

let incrementByTen = makeIncrementer(forIncrement: 10)`,
      highlightLine: 2,
      stackVars: [
        { name: "amount", value: "10", color: indigo },
        { name: "runningTotal", value: "0", color: indigo },
      ],
      captureBoxes: [],
    },
    {
      title: l ? "Closure retornado → Heap" : "Closure returned → Heap",
      description: l
        ? "makeIncrementer retorna incrementer. Pero incrementer usa runningTotal y amount — que viven en el stack frame que está a punto de destruirse. Swift los mueve a una 'capture box' en el heap para que sobrevivan. El closure apunta a esa box."
        : "makeIncrementer returns incrementer. But incrementer uses runningTotal and amount — which live in the stack frame about to be destroyed. Swift moves them to a 'capture box' on the heap so they survive. The closure points to that box.",
      code: `let incrementByTen = makeIncrementer(forIncrement: 10)
// makeIncrementer's stack frame is gone
// but runningTotal and amount survive in the heap!`,
      highlightLine: 1,
      stackVars: [
        { name: "incrementByTen", value: "closure", pointsTo: "box-a", color: "#EC695B" },
      ],
      captureBoxes: [
        {
          id: "box-a",
          label: "Capture Box A",
          color: cyan,
          borderColor: "#0891b2",
          vars: [
            { name: "runningTotal", value: "0" },
            { name: "amount", value: "10" },
          ],
          refCount: 1,
        },
      ],
    },
    {
      title: l ? "Llamar al closure" : "Call the closure",
      description: l
        ? "Cada vez que llamas incrementByTen(), el closure accede a su capture box en el heap y modifica runningTotal. El stack frame de la función original ya no existe — pero las variables capturadas siguen vivas."
        : "Each time you call incrementByTen(), the closure accesses its capture box on the heap and modifies runningTotal. The original function's stack frame is long gone — but the captured variables live on.",
      code: `incrementByTen()  // returns 10
incrementByTen()  // returns 20
incrementByTen()  // returns 30
// runningTotal persists between calls!`,
      highlightLine: 3,
      stackVars: [
        { name: "incrementByTen", value: "closure", pointsTo: "box-a", color: "#EC695B" },
      ],
      captureBoxes: [
        {
          id: "box-a",
          label: "Capture Box A",
          color: cyan,
          borderColor: "#0891b2",
          vars: [
            { name: "runningTotal", value: "30", highlight: true },
            { name: "amount", value: "10" },
          ],
          refCount: 1,
        },
      ],
    },
    {
      title: l ? "Segundo closure = nueva box" : "Second closure = new box",
      description: l
        ? "Crear un segundo closure con makeIncrementer crea una NUEVA capture box en el heap, completamente independiente. incrementBySeven tiene su propio runningTotal en 0 y amount en 7. No comparten nada."
        : "Creating a second closure with makeIncrementer creates a NEW capture box on the heap, completely independent. incrementBySeven has its own runningTotal at 0 and amount at 7. They share nothing.",
      code: `let incrementBySeven = makeIncrementer(forIncrement: 7)
incrementBySeven() // returns 7 (its OWN runningTotal)
incrementByTen()   // returns 40 (unaffected)`,
      highlightLine: 1,
      stackVars: [
        { name: "incrementByTen", value: "closure", pointsTo: "box-a", color: "#EC695B" },
        { name: "incrementBySeven", value: "closure", pointsTo: "box-b", color: purple },
      ],
      captureBoxes: [
        {
          id: "box-a",
          label: "Capture Box A",
          color: cyan,
          borderColor: "#0891b2",
          vars: [
            { name: "runningTotal", value: "40" },
            { name: "amount", value: "10" },
          ],
          refCount: 1,
        },
        {
          id: "box-b",
          label: "Capture Box B",
          color: green,
          borderColor: "#16a34a",
          vars: [
            { name: "runningTotal", value: "7", highlight: true },
            { name: "amount", value: "7" },
          ],
          refCount: 1,
        },
      ],
    },
    {
      title: l ? "Reference type: compartir" : "Reference type: sharing",
      description: l
        ? "Los closures son reference types. Asignar incrementByTen a otra variable NO copia el closure — ambas apuntan al MISMO closure con la MISMA capture box. Llamar a cualquiera de las dos modifica el mismo runningTotal. Es como dos controles remoto para la misma TV."
        : "Closures are reference types. Assigning incrementByTen to another variable does NOT copy the closure — both point to the SAME closure with the SAME capture box. Calling either one modifies the same runningTotal. It's like two remote controls for the same TV.",
      code: `let alsoIncrementByTen = incrementByTen
// Both point to the SAME closure

alsoIncrementByTen() // returns 50
incrementByTen()     // returns 60 (same runningTotal!)`,
      highlightLine: 4,
      stackVars: [
        { name: "incrementByTen", value: "closure", pointsTo: "box-a", color: "#EC695B" },
        { name: "alsoIncrementByTen", value: "closure", pointsTo: "box-a", color: "#EC695B" },
        { name: "incrementBySeven", value: "closure", pointsTo: "box-b", color: purple, faded: true },
      ],
      captureBoxes: [
        {
          id: "box-a",
          label: "Capture Box A",
          color: cyan,
          borderColor: "#0891b2",
          vars: [
            { name: "runningTotal", value: "60", highlight: true },
            { name: "amount", value: "10" },
          ],
          refCount: 2,
        },
        {
          id: "box-b",
          label: "Capture Box B",
          color: green,
          borderColor: "#16a34a",
          vars: [
            { name: "runningTotal", value: "7" },
            { name: "amount", value: "7" },
          ],
          refCount: 1,
        },
      ],
    },
  ];
}

// ─── MAIN COMPONENT ───

export default function ClosureCaptureVisualizer({ lang = "es" }: { lang?: Lang }) {
  const l = lang === "es";
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = getSteps(l);
  const step = steps[currentStep];

  const goToStep = (i: number) => {
    if (i === currentStep) return;
    setCurrentStep(i);
  };

  const codeHtml = highlighter.codeToHtml(step.code, {
    lang: "swift",
    theme: "one-dark-pro",
    transformers: [
      {
        pre(node) {
          node.properties.style = `${node.properties.style ?? ""};margin:0;padding:14px 16px;overflow-x:auto;font-size:12.5px;line-height:1.75;font-family:'SF Mono','Fira Code',monospace;border-radius:0;`;
        },
        line(node, line) {
          if (step.highlightLine && line === step.highlightLine) {
            node.properties.style = `${node.properties.style ?? ""};background:rgba(236,105,91,0.13);margin:0 -16px;padding:0 16px;display:inline-block;width:calc(100% + 32px);border-left:3px solid #EC695B;padding-left:13px;`;
          }
        },
      },
    ],
  });

  return (
    <div style={{ maxWidth: 800, margin: "28px auto", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: theme.text }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: theme.badgeBg, borderRadius: 20, fontSize: 12, fontWeight: 700, color: theme.badgeText, letterSpacing: 0.5, textTransform: "uppercase" }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          {l ? "Interactivo" : "Interactive"}
        </div>
        <h3 style={{ margin: "12px 0 4px", fontSize: 20, fontWeight: 800, color: theme.text, letterSpacing: -0.3 }}>
          {l ? "¿Cómo captura un closure?" : "How does a closure capture?"}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>
          {l
            ? "Observa cómo las variables se mueven del stack al heap cuando un closure las captura."
            : "Watch how variables move from the stack to the heap when a closure captures them."}
        </p>
      </div>

      {/* Step buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => goToStep(i)}
            style={{
              padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${i === currentStep ? "transparent" : theme.btnBorder}`,
              background: i === currentStep ? theme.activeBg : theme.btnBg,
              color: i === currentStep ? theme.activeText : theme.btnText,
              fontSize: 11, fontWeight: i === currentStep ? 700 : 500,
              cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {/* Code */}
      <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${theme.border}`, marginBottom: 16 }}>
        <div style={{ padding: "8px 14px", background: theme.surface, fontSize: 11, fontWeight: 700, color: theme.textFaint, letterSpacing: 0.5, textTransform: "uppercase", borderBottom: `1px solid ${theme.border}`, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          Swift
        </div>
        <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
      </div>

      {/* Memory: Stack → Heap */}
      <div className="closure-viz-grid" style={{ display: "grid", gridTemplateColumns: "1fr 24px 1.2fr", gap: 0, alignItems: "stretch", marginBottom: 16 }}>
        {/* Stack */}
        <div style={{ background: theme.stackBg, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12, fontFamily: "'SF Mono', 'Fira Code', monospace", textAlign: "center" }}>
            Stack
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {step.stackVars.map((v) => (
              <div
                key={v.name}
                style={{
                  padding: "8px 10px", borderRadius: 8, border: `2px solid ${v.color}`,
                  background: theme.slotBg, fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11,
                  transition: "all 0.3s", opacity: v.faded ? 0.35 : 1,
                }}
              >
                <div style={{ fontWeight: 700, color: v.color, marginBottom: 2 }}>{v.name}</div>
                <div style={{ fontSize: 10, color: theme.textFaint }}>
                  {v.value}
                  {v.pointsTo && <span style={{ color: theme.accentText }}> → {v.pointsTo}</span>}
                </div>
              </div>
            ))}
            {step.stackVars.length === 0 && (
              <div style={{ textAlign: "center", color: theme.textFaint, fontSize: 11, fontStyle: "italic", padding: 16 }}>
                {l ? "(frame destruido)" : "(frame destroyed)"}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: theme.arrowColor, fontSize: 18, fontWeight: 700 }}>
          {step.captureBoxes.length > 0 ? "→" : ""}
        </div>

        {/* Heap */}
        <div style={{ background: theme.heapBg, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12, fontFamily: "'SF Mono', 'Fira Code', monospace", textAlign: "center" }}>
            Heap
          </div>
          {step.captureBoxes.length === 0 ? (
            <div style={{ textAlign: "center", color: theme.textFaint, fontSize: 11, fontStyle: "italic", padding: 16 }}>
              {l ? "(vacío — todo en el stack)" : "(empty — everything on stack)"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {step.captureBoxes.map((box) => (
                <div key={box.id} style={{ borderRadius: 8, border: `2px solid ${box.borderColor}`, overflow: "hidden", transition: "all 0.3s" }}>
                  <div style={{ padding: "6px 10px", background: box.color, fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'SF Mono', 'Fira Code', monospace", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{box.label}</span>
                    <span style={{ fontSize: 9, background: "rgba(255,255,255,0.25)", padding: "2px 6px", borderRadius: 4 }}>
                      refCount: {box.refCount}
                    </span>
                  </div>
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4, background: theme.slotBg }}>
                    {box.vars.map((v) => (
                      <div
                        key={v.name}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "5px 8px", borderRadius: 5,
                          border: `1px solid ${v.highlight ? theme.highlightBorder : theme.border}`,
                          background: v.highlight ? theme.highlightBg : "transparent",
                          fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11,
                          transition: "all 0.3s",
                        }}
                      >
                        <span style={{ color: theme.textMuted, fontWeight: 500 }}>{v.name}</span>
                        <span style={{ fontWeight: 700, color: v.highlight ? theme.highlightText : theme.accentText }}>{v.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: "14px 18px", background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, fontSize: 14, lineHeight: 1.65, color: theme.textMuted }}>
        <span style={{ fontWeight: 800, color: theme.accentText, marginRight: 8, fontSize: 13, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
          {l ? `Paso ${currentStep + 1}/${steps.length}` : `Step ${currentStep + 1}/${steps.length}`}
        </span>
        {step.description}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <button
          onClick={() => goToStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.btnBorder}`, background: currentStep === 0 ? "transparent" : theme.btnBg, color: currentStep === 0 ? theme.textFaint : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: currentStep === 0 ? "default" : "pointer", transition: "all 0.2s", fontFamily: "inherit", opacity: currentStep === 0 ? 0.4 : 1 }}
        >
          ← {l ? "Anterior" : "Previous"}
        </button>
        <button
          onClick={() => goToStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid transparent", background: currentStep === steps.length - 1 ? theme.btnBg : theme.activeBg, color: currentStep === steps.length - 1 ? theme.textFaint : theme.activeText, fontSize: 13, fontWeight: 600, cursor: currentStep === steps.length - 1 ? "default" : "pointer", transition: "all 0.2s", fontFamily: "inherit", opacity: currentStep === steps.length - 1 ? 0.4 : 1 }}
        >
          {l ? "Siguiente" : "Next"} →
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .closure-viz-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .closure-viz-grid > div:nth-child(2) { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}
