import { useState, useEffect } from "react";

// ─── TYPES ───

type Lang = "es" | "en";

interface FuncDef {
  name: string;
  symbol: string;
  impl: (a: number, b: number) => number;
  code: string;
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
        accentText: "#EC695B",
        badgeBg: "rgba(236,105,91,0.15)",
        badgeText: "#F59B90",
        activeBg: "#3f3f46",
        activeText: "#fff",
        btnBg: "#27272a",
        btnText: "#a1a1aa",
        btnBorder: "rgba(255,255,255,0.08)",
        resultBg: "rgba(34,197,94,0.12)",
        resultBorder: "#22c55e",
        resultText: "#4ade80",
        typeBg: "rgba(99,102,241,0.12)",
        typeBorder: "#6366f1",
        typeText: "#a5b4fc",
        varBg: "rgba(236,105,91,0.08)",
        varBorder: "rgba(236,105,91,0.3)",
        sliderTrack: "#3f3f46",
        sliderThumb: "#EC695B",
      }
    : {
        bg: "#fff",
        surface: "#F8F8F5",
        surfaceAlt: "#F0F0EC",
        border: "rgba(0,0,0,0.06)",
        text: "#333",
        textMuted: "#666",
        textFaint: "#999",
        accentText: "#DC5648",
        badgeBg: "rgba(220,86,72,0.1)",
        badgeText: "#DC5648",
        activeBg: "#1a1a1a",
        activeText: "#fff",
        btnBg: "#f5f5f0",
        btnText: "#666",
        btnBorder: "rgba(0,0,0,0.08)",
        resultBg: "rgba(34,197,94,0.06)",
        resultBorder: "#22c55e",
        resultText: "#16a34a",
        typeBg: "rgba(99,102,241,0.06)",
        typeBorder: "#6366f1",
        typeText: "#4f46e5",
        varBg: "rgba(220,86,72,0.04)",
        varBorder: "rgba(220,86,72,0.2)",
        sliderTrack: "#e5e5e0",
        sliderThumb: "#DC5648",
      };
}

// ─── DATA ───

const functions: FuncDef[] = [
  {
    name: "addTwoInts",
    symbol: "+",
    impl: (a, b) => a + b,
    code: "func addTwoInts(_ a: Int, _ b: Int) -> Int { a + b }",
  },
  {
    name: "multiplyTwoInts",
    symbol: "×",
    impl: (a, b) => a * b,
    code: "func multiplyTwoInts(_ a: Int, _ b: Int) -> Int { a * b }",
  },
  {
    name: "subtractTwoInts",
    symbol: "−",
    impl: (a, b) => a - b,
    code: "func subtractTwoInts(_ a: Int, _ b: Int) -> Int { a - b }",
  },
  {
    name: "powerOfTwo",
    symbol: "^",
    impl: (a, b) => Math.pow(a, b),
    code: "func powerOfTwo(_ a: Int, _ b: Int) -> Int { Int(pow(Double(a), Double(b))) }",
  },
];

// ─── COMPONENT ───

export default function FunctionTypesVisualizer({
  lang = "es",
}: {
  lang?: Lang;
}) {
  const l = lang === "es";
  const theme = useTheme();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [argA, setArgA] = useState(5);
  const [argB, setArgB] = useState(3);
  const [prevResult, setPrevResult] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  const selected = functions[selectedIdx];
  const result = selected.impl(argA, argB);

  const selectFunction = (idx: number) => {
    if (idx === selectedIdx) return;
    setPrevResult(result);
    setAnimating(true);
    setSelectedIdx(idx);
    setTimeout(() => setAnimating(false), 400);
  };

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
      <div style={{ textAlign: "center", marginBottom: 20 }}>
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
          {l ? "Funciones como valores" : "Functions as values"}
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
            ? "Asigna diferentes funciones a la misma variable y observa cómo cambia el resultado."
            : "Assign different functions to the same variable and watch the result change."}
        </p>
      </div>

      {/* Type badge — always the same */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: 8,
            background: theme.typeBg,
            border: `2px solid ${theme.typeBorder}`,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: theme.typeText,
          }}
        >
          {l ? "El tipo nunca cambia" : "The type never changes"}:{" "}
          <span style={{ opacity: 0.7 }}>{"(Int, Int) -> Int"}</span>
        </div>
      </div>

      {/* Function selector */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
          marginBottom: 20,
        }}
      >
        {functions.map((fn, i) => (
          <button
            key={fn.name}
            onClick={() => selectFunction(i)}
            style={{
              padding: "10px 8px",
              borderRadius: 10,
              border: `2px solid ${i === selectedIdx ? theme.accentText : theme.btnBorder}`,
              background: i === selectedIdx ? theme.activeBg : theme.btnBg,
              color: i === selectedIdx ? theme.activeText : theme.btnText,
              fontSize: 12,
              fontWeight: i === selectedIdx ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>
              {fn.symbol}
            </span>
            {fn.name}
          </button>
        ))}
      </div>

      {/* Variable assignment visualization */}
      <div
        style={{
          background: theme.varBg,
          border: `2px solid ${theme.varBorder}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: 13,
        }}
      >
        <div style={{ color: theme.textFaint, marginBottom: 6, fontSize: 11 }}>
          {l ? "// La variable apunta a:" : "// The variable points to:"}
        </div>
        <div>
          <span style={{ color: theme.typeText, fontWeight: 600 }}>var</span>{" "}
          <span style={{ color: theme.accentText, fontWeight: 700 }}>
            mathFunction
          </span>
          <span style={{ color: theme.textFaint }}>
            {": (Int, Int) -> Int"}
          </span>{" "}
          <span style={{ color: theme.textFaint }}>=</span>{" "}
          <span
            style={{
              color: theme.text,
              fontWeight: 700,
              transition: "all 0.3s",
            }}
          >
            {selected.name}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: theme.surface,
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            fontSize: 11,
            color: theme.textMuted,
            transition: "all 0.3s",
          }}
        >
          {selected.code}
        </div>
      </div>

      {/* Argument sliders */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {[
          { label: "a", value: argA, setter: setArgA },
          { label: "b", value: argB, setter: setArgB },
        ].map(({ label, value, setter }) => (
          <div
            key={label}
            style={{
              background: theme.surface,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              padding: 14,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: theme.textFaint,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {l ? `Argumento ${label}` : `Argument ${label}`}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: theme.text,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                marginBottom: 8,
              }}
            >
              {value}
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: theme.sliderThumb,
                cursor: "pointer",
              }}
            />
          </div>
        ))}
      </div>

      {/* Result */}
      <div
        style={{
          background: theme.resultBg,
          border: `2px solid ${theme.resultBorder}`,
          borderRadius: 12,
          padding: 20,
          textAlign: "center",
          transition: "all 0.3s",
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: theme.resultText,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: 700,
            marginBottom: 4,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          mathFunction({argA}, {argB})
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {animating && prevResult !== null && (
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: theme.textFaint,
                textDecoration: "line-through",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                opacity: 0.5,
                transition: "opacity 0.3s",
              }}
            >
              {prevResult}
            </span>
          )}
          <span
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: theme.resultText,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              transition: "all 0.3s",
              transform: animating ? "scale(1.15)" : "scale(1)",
            }}
          >
            {result}
          </span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: theme.textMuted,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          {argA} {selected.symbol} {argB} = {result}
          <span style={{ marginLeft: 12, opacity: 0.5 }}>
            via {selected.name}
          </span>
        </div>
      </div>

      {/* Insight */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: theme.surface,
          borderRadius: 10,
          border: `1px solid ${theme.border}`,
          fontSize: 13,
          lineHeight: 1.6,
          color: theme.textMuted,
          textAlign: "center",
        }}
      >
        {l
          ? "La variable cambia de función, los argumentos cambian de valor — pero el tipo "
          : "The variable changes function, the arguments change value — but the type "}
        <span
          style={{
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontWeight: 700,
            color: theme.typeText,
          }}
        >
          (Int, Int) -&gt; Int
        </span>
        {l ? " nunca cambia. Eso es type safety." : " never changes. That's type safety."}
      </div>

      <style>{`
        @media (max-width: 540px) {
          .func-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
