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

interface StackSlot {
  label: string;
  value: string;
  bytes: number;
  color: string;
  opacity?: number;
}

interface StackFrame {
  name: string;
  color: string;
  borderColor: string;
  slots: StackSlot[];
}

interface Step {
  title: string;
  description: string;
  code: string;
  highlightLine?: number;
  frames: StackFrame[];
  pointerLabel: string;
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
        codeBg: "#0d1117",
        frameBg: "rgba(255,255,255,0.04)",
        slotBg: "rgba(255,255,255,0.06)",
        pointerColor: "#EC695B",
        stepActiveBg: "#3f3f46",
        stepActiveText: "#fff",
        stepBg: "#27272a",
        stepText: "#a1a1aa",
        stepBorder: "rgba(255,255,255,0.08)",
        badgeBg: "rgba(236,105,91,0.15)",
        badgeText: "#F59B90",
        accentText: "#EC695B",
      }
    : {
        bg: "#fff",
        surface: "#F8F8F5",
        surfaceAlt: "#F0F0EC",
        border: "rgba(0,0,0,0.06)",
        text: "#333",
        textMuted: "#666",
        textFaint: "#999",
        codeBg: "#1a1b26",
        frameBg: "rgba(0,0,0,0.02)",
        slotBg: "#fff",
        pointerColor: "#DC5648",
        stepActiveBg: "#1a1a1a",
        stepActiveText: "#fff",
        stepBg: "#f5f5f0",
        stepText: "#666",
        stepBorder: "rgba(0,0,0,0.08)",
        badgeBg: "rgba(220,86,72,0.1)",
        badgeText: "#DC5648",
        accentText: "#DC5648",
      };
}

// ─── STEP DATA ───

function getSteps(l: boolean): Step[] {
  const mainFrameColor = "#6366f1";
  const mainBorder = "#4f46e5";
  const calcFrameColor = "#06b6d4";
  const calcBorder = "#0891b2";
  const slotColor = "#3b82f6";

  return [
    {
      title: l ? "Estado inicial" : "Initial state",
      description: l
        ? "Antes de llamar a la función. Solo existe el frame de main() con la variable resultado sin inicializar."
        : "Before calling the function. Only the main() frame exists with the result variable uninitialized.",
      code: `func calculateArea(base: Double, height: Double) -> Double {
    let area = base * height
    return area
}

let result = calculateArea(base: 10.0, height: 5.0)`,
      highlightLine: 6,
      frames: [
        {
          name: "main()",
          color: mainFrameColor,
          borderColor: mainBorder,
          slots: [
            {
              label: "result",
              value: "—",
              bytes: 8,
              color: slotColor,
              opacity: 0.4,
            },
          ],
        },
      ],
      pointerLabel: "Stack Pointer ↑",
    },
    {
      title: l ? "Llamada a función" : "Function call",
      description: l
        ? "Se crea un nuevo stack frame para calculateArea(). Los parámetros base y height se copian al frame. El stack pointer avanza."
        : "A new stack frame is created for calculateArea(). Parameters base and height are copied into the frame. The stack pointer advances.",
      code: `func calculateArea(base: Double, height: Double) -> Double {
    let area = base * height
    return area
}

let result = calculateArea(base: 10.0, height: 5.0)`,
      highlightLine: 1,
      frames: [
        {
          name: "main()",
          color: mainFrameColor,
          borderColor: mainBorder,
          slots: [
            {
              label: "result",
              value: "—",
              bytes: 8,
              color: slotColor,
              opacity: 0.4,
            },
          ],
        },
        {
          name: "calculateArea()",
          color: calcFrameColor,
          borderColor: calcBorder,
          slots: [
            {
              label: "base",
              value: "10.0",
              bytes: 8,
              color: slotColor,
            },
            {
              label: "height",
              value: "5.0",
              bytes: 8,
              color: slotColor,
            },
          ],
        },
      ],
      pointerLabel: "Stack Pointer ↑",
    },
    {
      title: l ? "Cálculo" : "Computation",
      description: l
        ? "Se calcula area = base * height. El resultado (50.0) se almacena como variable local en el stack frame. 8 bytes más en el stack."
        : "area = base * height is computed. The result (50.0) is stored as a local variable in the stack frame. 8 more bytes on the stack.",
      code: `func calculateArea(base: Double, height: Double) -> Double {
    let area = base * height // 10.0 * 5.0 = 50.0
    return area
}

let result = calculateArea(base: 10.0, height: 5.0)`,
      highlightLine: 2,
      frames: [
        {
          name: "main()",
          color: mainFrameColor,
          borderColor: mainBorder,
          slots: [
            {
              label: "result",
              value: "—",
              bytes: 8,
              color: slotColor,
              opacity: 0.4,
            },
          ],
        },
        {
          name: "calculateArea()",
          color: calcFrameColor,
          borderColor: calcBorder,
          slots: [
            {
              label: "base",
              value: "10.0",
              bytes: 8,
              color: slotColor,
            },
            {
              label: "height",
              value: "5.0",
              bytes: 8,
              color: slotColor,
            },
            {
              label: "area",
              value: "50.0",
              bytes: 8,
              color: "#22c55e",
            },
          ],
        },
      ],
      pointerLabel: "Stack Pointer ↑",
    },
    {
      title: l ? "Retorno" : "Return",
      description: l
        ? "El valor 50.0 se copia al contexto que llamó la función. La variable result en main() ahora tiene su valor."
        : "The value 50.0 is copied to the calling context. The result variable in main() now has its value.",
      code: `func calculateArea(base: Double, height: Double) -> Double {
    let area = base * height
    return area // → 50.0 copied to caller
}

let result = calculateArea(base: 10.0, height: 5.0)`,
      highlightLine: 3,
      frames: [
        {
          name: "main()",
          color: mainFrameColor,
          borderColor: mainBorder,
          slots: [
            {
              label: "result",
              value: "50.0",
              bytes: 8,
              color: "#22c55e",
            },
          ],
        },
        {
          name: "calculateArea()",
          color: calcFrameColor,
          borderColor: calcBorder,
          slots: [
            {
              label: "base",
              value: "10.0",
              bytes: 8,
              color: slotColor,
              opacity: 0.35,
            },
            {
              label: "height",
              value: "5.0",
              bytes: 8,
              color: slotColor,
              opacity: 0.35,
            },
            {
              label: "area",
              value: "50.0",
              bytes: 8,
              color: "#22c55e",
              opacity: 0.35,
            },
          ],
        },
      ],
      pointerLabel: "Stack Pointer ↓",
    },
    {
      title: l ? "Limpieza" : "Cleanup",
      description: l
        ? "El stack frame de calculateArea() se destruye. El stack pointer retrocede. Solo queda main() con result = 50.0. Sin malloc, sin free, sin ARC. Solo un puntero que se movió."
        : "The calculateArea() stack frame is destroyed. The stack pointer moves back. Only main() remains with result = 50.0. No malloc, no free, no ARC. Just a pointer that moved.",
      code: `func calculateArea(base: Double, height: Double) -> Double {
    let area = base * height
    return area
}

let result = calculateArea(base: 10.0, height: 5.0)
// result = 50.0 ✅`,
      highlightLine: 7,
      frames: [
        {
          name: "main()",
          color: mainFrameColor,
          borderColor: mainBorder,
          slots: [
            {
              label: "result",
              value: "50.0",
              bytes: 8,
              color: "#22c55e",
            },
          ],
        },
      ],
      pointerLabel: "Stack Pointer ↑",
    },
  ];
}

// ─── MAIN COMPONENT ───

export default function StackMemoryVisualizer({ lang = "es" }: { lang?: Lang }) {
  const l = lang === "es";
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const steps = getSteps(l);
  const step = steps[currentStep];

  const goToStep = (index: number) => {
    if (index === currentStep || isAnimating) return;
    setIsAnimating(true);
    setCurrentStep(index);
    setTimeout(() => setIsAnimating(false), 350);
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

  const totalBytes = step.frames.reduce(
    (sum, f) => sum + f.slots.reduce((s, sl) => s + sl.bytes, 0),
    0
  );

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
      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            background: theme.badgeBg,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            color: theme.badgeText,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          <span style={{ fontSize: 14 }}>⚡</span>
          {l ? "Interactivo" : "Interactive"}
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
          {l
            ? "¿Cómo se mueve el Stack?"
            : "How does the Stack move?"}
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
            ? "Haz clic en cada paso para ver cómo el stack frame crece y se destruye."
            : "Click each step to see how the stack frame grows and gets destroyed."}
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
              background: i === currentStep ? theme.stepActiveBg : theme.stepBg,
              color: i === currentStep ? theme.stepActiveText : theme.stepText,
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

      {/* Main content: code + stack */}
      <div
        className="stack-viz-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Code panel */}
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${theme.border}`,
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

        {/* Stack visualization */}
        <div
          style={{
            background: theme.surface,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            padding: 16,
            minHeight: 300,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.textFaint,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              textAlign: "center",
            }}
          >
            Stack
          </div>

          {/* Stack frames - rendered bottom to top */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column-reverse",
              gap: 8,
              justifyContent: "flex-start",
            }}
          >
            {step.frames.map((frame, fi) => (
              <div
                key={frame.name}
                style={{
                  borderRadius: 8,
                  border: `2px solid ${frame.borderColor}`,
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  opacity: 1,
                }}
              >
                {/* Frame header */}
                <div
                  style={{
                    padding: "6px 10px",
                    background: frame.color,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{frame.name}</span>
                  <span
                    style={{
                      fontSize: 9,
                      opacity: 0.8,
                      fontWeight: 500,
                    }}
                  >
                    {frame.slots.reduce((s, sl) => s + sl.bytes, 0)}B
                  </span>
                </div>

                {/* Slots */}
                <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                  {frame.slots.map((slot, si) => (
                    <div
                      key={`${frame.name}-${slot.label}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "5px 8px",
                        borderRadius: 5,
                        background: theme.slotBg,
                        border: `1px solid ${theme.border}`,
                        fontSize: 11,
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        opacity: slot.opacity ?? 1,
                        transition: "all 0.3s ease",
                      }}
                    >
                      <span style={{ color: theme.textMuted, fontWeight: 500 }}>
                        {slot.label}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              slot.value === "—"
                                ? theme.textFaint
                                : slot.color === "#22c55e"
                                  ? "#22c55e"
                                  : theme.accentText,
                          }}
                        >
                          {slot.value}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: theme.textFaint,
                            fontWeight: 400,
                          }}
                        >
                          {slot.bytes}B
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Ghost frame for step 4 (return) */}
            {currentStep === 3 && (
              <div
                style={{
                  borderRadius: 8,
                  border: `2px dashed rgba(6,182,212,0.25)`,
                  padding: 12,
                  textAlign: "center",
                  fontSize: 10,
                  color: theme.textFaint,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontStyle: "italic",
                  opacity: 0.6,
                }}
              >
                {l ? "← valor copiado a main()" : "← value copied to main()"}
              </div>
            )}
          </div>

          {/* Stack pointer */}
          <div
            style={{
              marginTop: 12,
              padding: "6px 0",
              borderTop: `2px solid ${theme.pointerColor}`,
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              color: theme.pointerColor,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              letterSpacing: 0.3,
            }}
          >
            {step.pointerLabel}
          </div>

          {/* Total bytes badge */}
          <div
            style={{
              marginTop: 8,
              textAlign: "center",
              fontSize: 10,
              color: theme.textFaint,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            Total: {totalBytes} bytes
          </div>
        </div>
      </div>

      {/* Step description */}
      <div
        style={{
          marginTop: 16,
          padding: "14px 18px",
          background: theme.surface,
          borderRadius: 10,
          border: `1px solid ${theme.border}`,
          fontSize: 14,
          lineHeight: 1.65,
          color: theme.textMuted,
        }}
      >
        <span
          style={{
            fontWeight: 800,
            color: theme.accentText,
            marginRight: 8,
            fontSize: 13,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          {l ? `Paso ${currentStep + 1}/${steps.length}` : `Step ${currentStep + 1}/${steps.length}`}
        </span>
        {step.description}
      </div>

      {/* Navigation arrows */}
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

      {/* Responsive fallback for mobile */}
      <style>{`
        @media (max-width: 640px) {
          .stack-viz-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
