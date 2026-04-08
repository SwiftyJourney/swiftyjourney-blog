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

interface MemorySlot {
  label: string;
  bytes: number;
  color: string;
  faded?: boolean;
  annotation?: string;
}

interface HeapBox {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  slots: { label: string; value: string; highlight?: boolean }[];
}

interface Step {
  title: string;
  description: string;
  code: string;
  highlightLine?: number;
  totalSize: string;
  memorySlots: MemorySlot[];
  heapBoxes?: HeapBox[];
  annotation?: string;
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
        accentText: "#f97316", badgeBg: "rgba(249,115,22,0.15)", badgeText: "#fb923c",
        activeBg: "#3f3f46", activeText: "#fff", btnBg: "#27272a", btnText: "#a1a1aa",
        btnBorder: "rgba(255,255,255,0.08)", slotBg: "rgba(255,255,255,0.06)",
        stackBg: "rgba(99,102,241,0.08)", heapBg: "rgba(6,182,212,0.08)",
        arrowColor: "#a1a1aa", highlightBg: "rgba(34,197,94,0.15)",
        highlightBorder: "#22c55e", highlightText: "#4ade80",
        tagColor: "#f97316", payloadColor: "#6366f1", unusedColor: "#3f3f46",
        heapColor: "#06b6d4", spareBitColor: "#a855f7",
      }
    : {
        bg: "#fff", surface: "#F8F8F5", border: "rgba(0,0,0,0.06)",
        text: "#333", textMuted: "#666", textFaint: "#999",
        accentText: "#ea580c", badgeBg: "rgba(234,88,12,0.1)", badgeText: "#ea580c",
        activeBg: "#1a1a1a", activeText: "#fff", btnBg: "#f5f5f0", btnText: "#666",
        btnBorder: "rgba(0,0,0,0.08)", slotBg: "#fff",
        stackBg: "rgba(99,102,241,0.04)", heapBg: "rgba(6,182,212,0.04)",
        arrowColor: "#999", highlightBg: "rgba(34,197,94,0.06)",
        highlightBorder: "#22c55e", highlightText: "#16a34a",
        tagColor: "#ea580c", payloadColor: "#6366f1", unusedColor: "#d4d4d8",
        heapColor: "#06b6d4", spareBitColor: "#7c3aed",
      };
}

// ─── STEP DATA ───

function getSteps(l: boolean): Step[] {
  const tag = "#f97316";
  const payload = "#6366f1";
  const unused = "#71717a";
  const heap = "#06b6d4";
  const spare = "#a855f7";

  return [
    {
      title: l ? "Enum simple (solo tag)" : "Simple enum (tag only)",
      description: l
        ? "Un enum de 4 casos necesita solo 2 bits para el tag (discriminador): 00, 01, 10, 11. El compilador redondea a 1 byte por alignment. Los 6 bits restantes no se usan. MemoryLayout<Direction>.size == 1."
        : "A 4-case enum needs only 2 bits for the tag (discriminator): 00, 01, 10, 11. The compiler rounds up to 1 byte for alignment. The remaining 6 bits are unused. MemoryLayout<Direction>.size == 1.",
      code: `enum Direction {
    case north   // tag: 00
    case south   // tag: 01
    case east    // tag: 10
    case west    // tag: 11
}

MemoryLayout<Direction>.size      // 1 byte
MemoryLayout<Direction>.stride    // 1 byte
MemoryLayout<Direction>.alignment // 1 byte`,
      highlightLine: 1,
      totalSize: "1 byte",
      memorySlots: [
        { label: "tag", bytes: 1, color: tag, annotation: "2 bits used / 6 unused" },
      ],
    },
    {
      title: l ? "Enum con raw values" : "Enum with raw values",
      description: l
        ? "Los raw values NO se almacenan en cada instancia — son metadata de compilación. El compilador genera una tabla de lookup, pero cada instancia del enum sigue ocupando solo 1 byte (el tag). Planet(rawValue: 3) usa la tabla para mapear 3 → .earth."
        : "Raw values are NOT stored in each instance — they're compile-time metadata. The compiler generates a lookup table, but each enum instance still uses only 1 byte (the tag). Planet(rawValue: 3) uses the table to map 3 → .earth.",
      code: `enum Planet: Int {
    case mercury = 1  // rawValue: metadata, not stored
    case venus        // rawValue = 2 (auto)
    case earth        // rawValue = 3 (auto)
    case mars         // rawValue = 4 (auto)
}

MemoryLayout<Planet>.size  // 1 byte — same as simple enum!
let p = Planet(rawValue: 3) // → .earth (via lookup table)`,
      highlightLine: 2,
      totalSize: "1 byte",
      memorySlots: [
        { label: "tag", bytes: 1, color: tag, annotation: l ? "raw values = metadata, no se almacenan" : "raw values = metadata, not stored" },
      ],
    },
    {
      title: l ? "Associated values (caso más grande)" : "Associated values (largest case)",
      description: l
        ? "Con associated values, el tamaño del enum = tag + el payload del caso más grande. Barcode.upc necesita 4×8 = 32 bytes. Barcode.qrCode necesita 16 bytes (String). El enum reserva 32 bytes de payload + 1 byte de tag = 33 bytes. Cuando es .qrCode, 16 bytes de payload quedan sin usar."
        : "With associated values, the enum's size = tag + the largest case's payload. Barcode.upc needs 4×8 = 32 bytes. Barcode.qrCode needs 16 bytes (String). The enum reserves 32 bytes payload + 1 byte tag = 33 bytes. When it's .qrCode, 16 payload bytes are unused.",
      code: `enum Barcode {
    case upc(Int, Int, Int, Int)  // 4 × 8 = 32 bytes
    case qrCode(String)           // String = 16 bytes
}

MemoryLayout<Barcode>.size      // 33 bytes (32 payload + 1 tag)
MemoryLayout<Barcode>.stride    // 40 bytes (alignment padding)
MemoryLayout<Barcode>.alignment // 8 bytes`,
      highlightLine: 2,
      totalSize: l ? "33 bytes (stride: 40)" : "33 bytes (stride: 40)",
      memorySlots: [
        { label: ".upc payload", bytes: 32, color: payload, annotation: "4 × Int (8 bytes)" },
        { label: "tag", bytes: 1, color: tag },
      ],
    },
    {
      title: l ? "Optional: spare bit optimization" : "Optional: spare bit optimization",
      description: l
        ? "Optional<Bool> ocupa solo 1 byte, no 2. Bool usa las bit patterns 0 y 1 — pero un byte tiene 256 patrones. El compilador usa el patrón 2 para representar .none. Esto se llama spare bit optimization: el tag se esconde en los bits sin usar del payload. Para Optional<referencia>, usa null (0x0) como .none — cero bytes extra."
        : "Optional<Bool> takes only 1 byte, not 2. Bool uses bit patterns 0 and 1 — but a byte has 256 patterns. The compiler uses pattern 2 to represent .none. This is spare bit optimization: the tag hides in unused payload bits. For Optional<reference>, it uses null (0x0) as .none — zero extra bytes.",
      code: `// Optional<T> is literally:
// enum Optional<T> { case none; case some(T) }

MemoryLayout<Bool>.size           // 1 byte
MemoryLayout<Bool?>.size          // 1 byte! (not 2)
// Bool uses 0, 1 — compiler uses 2 for .none

MemoryLayout<Int?>.size           // 9 bytes (8 + 1 tag)
// Int uses ALL bit patterns — no spare bits

MemoryLayout<String?>.size        // 16 bytes (same as String!)
// Reference inside String has null → .none for free`,
      highlightLine: 5,
      totalSize: l ? "1 byte (Bool?) vs 9 bytes (Int?)" : "1 byte (Bool?) vs 9 bytes (Int?)",
      memorySlots: [
        { label: "Bool?", bytes: 1, color: spare, annotation: l ? "0=false, 1=true, 2=none" : "0=false, 1=true, 2=none" },
        { label: "Int?", bytes: 9, color: payload, annotation: l ? "8 payload + 1 tag (sin spare bits)" : "8 payload + 1 tag (no spare bits)" },
      ],
    },
    {
      title: l ? "indirect: puntero al heap" : "indirect: heap pointer",
      description: l
        ? "Un enum recursivo necesita indirect porque su tamaño sería infinito: ArithmeticExpression contendría ArithmeticExpression que contendría ArithmeticExpression... Con indirect, cada caso recursivo almacena un puntero de 8 bytes al heap. El dato real vive en el heap, y el tamaño del enum es fijo: 8 bytes."
        : "A recursive enum needs indirect because its size would be infinite: ArithmeticExpression would contain ArithmeticExpression which would contain ArithmeticExpression... With indirect, each recursive case stores an 8-byte heap pointer. The actual data lives on the heap, and the enum's size is fixed: 8 bytes.",
      code: `indirect enum ArithmeticExpression {
    case number(Int)
    case addition(ArithmeticExpression, ArithmeticExpression)
    case multiplication(ArithmeticExpression, ArithmeticExpression)
}

MemoryLayout<ArithmeticExpression>.size // 8 bytes (pointer)
// Without indirect → infinite size! (compile error)

let expr: ArithmeticExpression =
    .addition(.number(5), .number(3))`,
      highlightLine: 1,
      totalSize: l ? "8 bytes (puntero)" : "8 bytes (pointer)",
      memorySlots: [
        { label: l ? "puntero al heap" : "heap pointer", bytes: 8, color: heap, annotation: "→ heap" },
      ],
      heapBoxes: [
        {
          id: "expr",
          label: ".addition",
          color: "#06b6d4",
          borderColor: "#0891b2",
          slots: [
            { label: "tag", value: "addition" },
            { label: "left", value: ".number(5)", highlight: true },
            { label: "right", value: ".number(3)", highlight: true },
          ],
        },
      ],
    },
  ];
}

// ─── BYTE BAR COMPONENT ───

function ByteBar({ slots, theme }: { slots: MemorySlot[]; theme: ReturnType<typeof useTheme> }) {
  const totalBytes = slots.reduce((acc, s) => acc + s.bytes, 0);
  const maxBarWidth = 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {slots.map((slot, i) => {
        const width = Math.max(12, (slot.bytes / Math.max(totalBytes, 1)) * maxBarWidth);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: `${width}%`,
                minWidth: 40,
                height: 32,
                background: slot.faded ? theme.unusedColor : slot.color,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                opacity: slot.faded ? 0.3 : 1,
                transition: "all 0.3s",
              }}
            >
              {slot.label}
            </div>
            <div style={{ fontSize: 10, color: theme.textFaint, fontFamily: "'SF Mono', 'Fira Code', monospace", whiteSpace: "nowrap" }}>
              {slot.bytes} {slot.bytes === 1 ? "byte" : "bytes"}
              {slot.annotation && <span style={{ color: theme.textMuted, marginLeft: 4 }}>— {slot.annotation}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───

export default function EnumMemoryVisualizer({ lang = "es" }: { lang?: Lang }) {
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
            node.properties.style = `${node.properties.style ?? ""};background:rgba(249,115,22,0.13);margin:0 -16px;padding:0 16px;display:inline-block;width:calc(100% + 32px);border-left:3px solid #f97316;padding-left:13px;`;
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
          {l ? "¿Cuánta memoria ocupa un enum?" : "How much memory does an enum use?"}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>
          {l
            ? "Explora cómo cambia el layout en memoria según el tipo de enum."
            : "Explore how the memory layout changes based on the enum type."}
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

      {/* Memory Layout */}
      <div className="enum-viz-layout" style={{ display: "grid", gridTemplateColumns: step.heapBoxes ? "1fr 24px 1fr" : "1fr", gap: 0, alignItems: "stretch", marginBottom: 16 }}>
        {/* Stack / Inline Memory */}
        <div style={{ background: theme.stackBg, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.payloadColor, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
              {l ? "Layout en memoria" : "Memory Layout"}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: theme.accentText, fontFamily: "'SF Mono', 'Fira Code', monospace", background: theme.badgeBg, padding: "3px 8px", borderRadius: 6 }}>
              {l ? "Total: " : "Total: "}{step.totalSize}
            </div>
          </div>
          <ByteBar slots={step.memorySlots} theme={theme} />
        </div>

        {/* Arrow (only when heap exists) */}
        {step.heapBoxes && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: theme.arrowColor, fontSize: 18, fontWeight: 700 }}>
            →
          </div>
        )}

        {/* Heap (only for indirect) */}
        {step.heapBoxes && (
          <div style={{ background: theme.heapBg, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12, fontFamily: "'SF Mono', 'Fira Code', monospace", textAlign: "center" }}>
              Heap
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {step.heapBoxes.map((box) => (
                <div key={box.id} style={{ borderRadius: 8, border: `2px solid ${box.borderColor}`, overflow: "hidden", transition: "all 0.3s" }}>
                  <div style={{ padding: "6px 10px", background: box.color, fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                    {box.label}
                  </div>
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4, background: theme.slotBg }}>
                    {box.slots.map((v) => (
                      <div
                        key={v.label}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "5px 8px", borderRadius: 5,
                          border: `1px solid ${v.highlight ? theme.highlightBorder : theme.border}`,
                          background: v.highlight ? theme.highlightBg : "transparent",
                          fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 11,
                          transition: "all 0.3s",
                        }}
                      >
                        <span style={{ color: theme.textMuted, fontWeight: 500 }}>{v.label}</span>
                        <span style={{ fontWeight: 700, color: v.highlight ? theme.highlightText : theme.accentText }}>{v.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
          .enum-viz-layout { grid-template-columns: 1fr !important; gap: 8px !important; }
          .enum-viz-layout > div:nth-child(2) { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}
