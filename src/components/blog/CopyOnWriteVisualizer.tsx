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

interface HeapBuffer {
  id: string;
  label: string;
  items: string[];
  color: string;
  refCount: number;
}

interface StackVar {
  name: string;
  pointsTo: string;
  color: string;
}

interface Step {
  title: string;
  description: string;
  code: string;
  highlightLine?: number;
  stackVars: StackVar[];
  heapBuffers: HeapBuffer[];
  cowTriggered?: boolean;
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
        bg: "#18181b",
        surface: "#27272a",
        surfaceAlt: "#1f1f23",
        border: "rgba(255,255,255,0.08)",
        text: "#e4e4e7",
        textMuted: "#a1a1aa",
        textFaint: "#71717a",
        pointerColor: "#f97316",
        stepActiveBg: "#3f3f46",
        stepActiveText: "#fff",
        stepBg: "#27272a",
        stepText: "#a1a1aa",
        stepBorder: "rgba(255,255,255,0.08)",
        badgeBg: "rgba(249,115,22,0.15)",
        badgeText: "#fb923c",
        accentText: "#f97316",
        slotBg: "rgba(255,255,255,0.06)",
        cowFlash: "rgba(34,197,94,0.15)",
        arrowColor: "#a1a1aa",
        stackBg: "rgba(99,102,241,0.08)",
        heapBg: "rgba(6,182,212,0.08)",
      }
    : {
        bg: "#fff",
        surface: "#F8F8F5",
        surfaceAlt: "#F0F0EC",
        border: "rgba(0,0,0,0.06)",
        text: "#333",
        textMuted: "#666",
        textFaint: "#999",
        pointerColor: "#ea580c",
        stepActiveBg: "#1a1a1a",
        stepActiveText: "#fff",
        stepBg: "#f5f5f0",
        stepText: "#666",
        stepBorder: "rgba(0,0,0,0.08)",
        badgeBg: "rgba(234,88,12,0.1)",
        badgeText: "#ea580c",
        accentText: "#ea580c",
        slotBg: "#fff",
        cowFlash: "rgba(34,197,94,0.08)",
        arrowColor: "#999",
        stackBg: "rgba(99,102,241,0.04)",
        heapBg: "rgba(6,182,212,0.04)",
      };
}

// ─── STEP DATA ───

function getSteps(l: boolean): Step[] {
  return [
    {
      title: l ? "Crear array" : "Create array",
      description: l
        ? "Se crea el array original. Swift aloca un buffer en el heap para almacenar los elementos. La variable fruits en el stack apunta a ese buffer."
        : "The original array is created. Swift allocates a buffer on the heap to store the elements. The fruits variable on the stack points to that buffer.",
      code: `var fruits = ["🍎", "🍊", "🍋"]

// fruits → buffer en el heap (refCount: 1)`,
      highlightLine: 1,
      stackVars: [{ name: "fruits", pointsTo: "buffer-a", color: "#6366f1" }],
      heapBuffers: [
        {
          id: "buffer-a",
          label: "Buffer A",
          items: ["🍎", "🍊", "🍋"],
          color: "#06b6d4",
          refCount: 1,
        },
      ],
    },
    {
      title: l ? "Asignar copia" : "Assign copy",
      description: l
        ? "Se asigna fruits a una nueva variable backup. ¡Pero NO se copia el buffer! Ambas variables apuntan al MISMO buffer en el heap. Solo incrementa el refCount a 2. Esto es instantáneo — O(1)."
        : "fruits is assigned to a new variable backup. But the buffer is NOT copied! Both variables point to the SAME heap buffer. Only the refCount increases to 2. This is instant — O(1).",
      code: `var fruits = ["🍎", "🍊", "🍋"]
var backup = fruits

// Ambos apuntan al MISMO buffer (refCount: 2)
// ¡No se copió nada! Solo un puntero.`,
      highlightLine: 2,
      stackVars: [
        { name: "fruits", pointsTo: "buffer-a", color: "#6366f1" },
        { name: "backup", pointsTo: "buffer-a", color: "#8b5cf6" },
      ],
      heapBuffers: [
        {
          id: "buffer-a",
          label: "Buffer A",
          items: ["🍎", "🍊", "🍋"],
          color: "#06b6d4",
          refCount: 2,
        },
      ],
    },
    {
      title: l ? "Mutar = Copy!" : "Mutate = Copy!",
      description: l
        ? "¡Copy-on-Write en acción! Al mutar fruits, Swift detecta que refCount > 1 y crea una COPIA del buffer antes de modificarlo. Ahora cada variable tiene su propio buffer. backup mantiene los datos originales intactos."
        : "Copy-on-Write in action! When mutating fruits, Swift detects refCount > 1 and creates a COPY of the buffer before modifying it. Now each variable has its own buffer. backup keeps the original data intact.",
      code: `var fruits = ["🍎", "🍊", "🍋"]
var backup = fruits

fruits.append("🍇") // ← CoW triggered!
// fruits tiene su propia copia ahora
// backup mantiene ["🍎", "🍊", "🍋"]`,
      highlightLine: 4,
      cowTriggered: true,
      stackVars: [
        { name: "fruits", pointsTo: "buffer-b", color: "#6366f1" },
        { name: "backup", pointsTo: "buffer-a", color: "#8b5cf6" },
      ],
      heapBuffers: [
        {
          id: "buffer-a",
          label: "Buffer A",
          items: ["🍎", "🍊", "🍋"],
          color: "#06b6d4",
          refCount: 1,
        },
        {
          id: "buffer-b",
          label: l ? "Buffer B (copia)" : "Buffer B (copy)",
          items: ["🍎", "🍊", "🍋", "🍇"],
          color: "#22c55e",
          refCount: 1,
        },
      ],
    },
    {
      title: l ? "Sin copia innecesaria" : "No unnecessary copy",
      description: l
        ? "Si solo una variable referencia el buffer (refCount == 1), Swift muta directamente sin copiar. El compilador puede incluso optimizar esto: si prueba que solo hay una referencia, elimina la comprobación del refCount por completo."
        : "If only one variable references the buffer (refCount == 1), Swift mutates directly without copying. The compiler can even optimize this: if it proves there's only one reference, it eliminates the refCount check entirely.",
      code: `var solo = ["🍎", "🍊", "🍋"]

solo.append("🍇") // refCount == 1, no copia
// Mutación directa sobre el buffer existente`,
      highlightLine: 3,
      stackVars: [{ name: "solo", pointsTo: "buffer-c", color: "#6366f1" }],
      heapBuffers: [
        {
          id: "buffer-c",
          label: l ? "Buffer (mutado directo)" : "Buffer (mutated directly)",
          items: ["🍎", "🍊", "🍋", "🍇"],
          color: "#22c55e",
          refCount: 1,
        },
      ],
    },
  ];
}

// ─── MAIN COMPONENT ───

export default function CopyOnWriteVisualizer({ lang = "es" }: { lang?: Lang }) {
  const l = lang === "es";
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = getSteps(l);
  const step = steps[currentStep];

  const goToStep = (index: number) => {
    if (index === currentStep) return;
    setCurrentStep(index);
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
            node.properties.style = `${node.properties.style ?? ""};background:rgba(249,115,22,0.13);margin:0 -16px;padding:0 16px;display:inline-block;width:calc(100% + 32px);border-left:3px solid #f97316;padding-left:13px;`;
          }
        },
      },
    ],
  });

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "28px auto",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: theme.text,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: step.cowTriggered ? theme.cowFlash : theme.badgeBg,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            color: step.cowTriggered ? "#22c55e" : theme.badgeText,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            transition: "all 0.3s",
          }}
        >
          <span style={{ fontSize: 14 }}>{step.cowTriggered ? "🐄" : "⚡"}</span>
          {step.cowTriggered
            ? "Copy-on-Write!"
            : l
              ? "Interactivo"
              : "Interactive"}
        </div>
        <h3
          style={{
            margin: "12px 0 4px",
            fontSize: 20,
            fontWeight: 800,
            color: theme.text,
            letterSpacing: -0.3,
          }}
        >
          {l ? "Copy-on-Write en acción" : "Copy-on-Write in action"}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: theme.textMuted,
            lineHeight: 1.5,
          }}
        >
          {l
            ? "Haz clic en cada paso para ver cómo Swift comparte y copia buffers."
            : "Click each step to see how Swift shares and copies buffers."}
        </p>
      </div>

      {/* Step buttons */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => goToStep(i)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${i === currentStep ? "transparent" : theme.stepBorder}`,
              background:
                i === currentStep
                  ? s.cowTriggered
                    ? "#22c55e"
                    : theme.stepActiveBg
                  : theme.stepBg,
              color:
                i === currentStep
                  ? s.cowTriggered
                    ? "#fff"
                    : theme.stepActiveText
                  : theme.stepText,
              fontSize: 12,
              fontWeight: i === currentStep ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {/* Code panel */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: `1px solid ${theme.border}`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: "8px 14px",
            background: theme.surface,
            fontSize: 11,
            fontWeight: 700,
            color: theme.textFaint,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            borderBottom: `1px solid ${theme.border}`,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          Swift
        </div>
        <div dangerouslySetInnerHTML={{ __html: codeHtml }} />
      </div>

      {/* Memory visualization: Stack → Heap */}
      <div
        className="cow-viz-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 24px 1fr",
          gap: 0,
          alignItems: "stretch",
          marginBottom: 16,
        }}
      >
        {/* Stack */}
        <div
          style={{
            background: theme.stackBg,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6366f1",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              textAlign: "center",
            }}
          >
            Stack
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {step.stackVars.map((v) => (
              <div
                key={v.name}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `2px solid ${v.color}`,
                  background: theme.slotBg,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: 12,
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: v.color,
                    marginBottom: 2,
                  }}
                >
                  {v.name}
                </div>
                <div style={{ fontSize: 10, color: theme.textFaint }}>
                  → {v.pointsTo}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.arrowColor,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          →
        </div>

        {/* Heap */}
        <div
          style={{
            background: theme.heapBg,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#06b6d4",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              textAlign: "center",
            }}
          >
            Heap
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {step.heapBuffers.map((buf) => (
              <div
                key={buf.id}
                style={{
                  borderRadius: 8,
                  border: `2px solid ${buf.color}`,
                  overflow: "hidden",
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    padding: "6px 10px",
                    background: buf.color,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{buf.label}</span>
                  <span
                    style={{
                      fontSize: 9,
                      background: "rgba(255,255,255,0.25)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    refCount: {buf.refCount}
                  </span>
                </div>
                <div
                  style={{
                    padding: "8px 10px",
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    background: theme.slotBg,
                  }}
                >
                  {buf.items.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: `1px solid ${theme.border}`,
                        fontSize: 14,
                        background: theme.surface,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step description */}
      <div
        style={{
          padding: "14px 18px",
          background: step.cowTriggered ? theme.cowFlash : theme.surface,
          borderRadius: 10,
          border: `1px solid ${step.cowTriggered ? "rgba(34,197,94,0.2)" : theme.border}`,
          fontSize: 14,
          lineHeight: 1.65,
          color: theme.textMuted,
          transition: "all 0.3s",
        }}
      >
        <span
          style={{
            fontWeight: 800,
            color: step.cowTriggered ? "#22c55e" : theme.accentText,
            marginRight: 8,
            fontSize: 13,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          {l ? `Paso ${currentStep + 1}/${steps.length}` : `Step ${currentStep + 1}/${steps.length}`}
        </span>
        {step.description}
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <button
          onClick={() => goToStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${theme.stepBorder}`,
            background: currentStep === 0 ? "transparent" : theme.stepBg,
            color: currentStep === 0 ? theme.textFaint : theme.textMuted,
            fontSize: 13,
            fontWeight: 600,
            cursor: currentStep === 0 ? "default" : "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
            opacity: currentStep === 0 ? 0.4 : 1,
          }}
        >
          ← {l ? "Anterior" : "Previous"}
        </button>
        <button
          onClick={() => goToStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid transparent",
            background:
              currentStep === steps.length - 1
                ? theme.stepBg
                : theme.stepActiveBg,
            color:
              currentStep === steps.length - 1
                ? theme.textFaint
                : theme.stepActiveText,
            fontSize: 13,
            fontWeight: 600,
            cursor: currentStep === steps.length - 1 ? "default" : "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
            opacity: currentStep === steps.length - 1 ? 0.4 : 1,
          }}
        >
          {l ? "Siguiente" : "Next"} →
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .cow-viz-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .cow-viz-grid > div:nth-child(2) {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
}
