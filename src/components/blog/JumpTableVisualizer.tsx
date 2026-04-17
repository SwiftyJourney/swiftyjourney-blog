import { useState, useEffect } from "react";

// ─── TYPES ───

type Lang = "es" | "en";
type Mode = "ifelse" | "jumptable";

interface EvalStep {
  label: string;
  address: string;
  active: boolean;
  match: boolean;
  skipped: boolean;
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
        border: "rgba(255,255,255,0.08)",
        text: "#e4e4e7",
        textMuted: "#a1a1aa",
        textFaint: "#71717a",
        accentText: "#EC695B",
        stepActiveBg: "#3f3f46",
        stepActiveText: "#fff",
        stepBg: "#27272a",
        stepText: "#a1a1aa",
        stepBorder: "rgba(255,255,255,0.08)",
        badgeBg: "rgba(236,105,91,0.15)",
        badgeText: "#F59B90",
        matchBg: "rgba(34,197,94,0.15)",
        matchBorder: "#22c55e",
        matchText: "#4ade80",
        evalBg: "rgba(234,179,8,0.12)",
        evalBorder: "#eab308",
        evalText: "#facc15",
        skipBg: "rgba(255,255,255,0.02)",
        skipText: "#52525b",
        arrowColor: "#EC695B",
        tableBg: "rgba(99,102,241,0.08)",
        tableHeaderBg: "rgba(99,102,241,0.15)",
      }
    : {
        bg: "#fff",
        surface: "#F8F8F5",
        border: "rgba(0,0,0,0.06)",
        text: "#333",
        textMuted: "#666",
        textFaint: "#999",
        accentText: "#DC5648",
        stepActiveBg: "#1a1a1a",
        stepActiveText: "#fff",
        stepBg: "#f5f5f0",
        stepText: "#666",
        stepBorder: "rgba(0,0,0,0.08)",
        badgeBg: "rgba(220,86,72,0.1)",
        badgeText: "#DC5648",
        matchBg: "rgba(34,197,94,0.08)",
        matchBorder: "#22c55e",
        matchText: "#16a34a",
        evalBg: "rgba(234,179,8,0.08)",
        evalBorder: "#eab308",
        evalText: "#a16207",
        skipBg: "rgba(0,0,0,0.02)",
        skipText: "#ccc",
        arrowColor: "#DC5648",
        tableBg: "rgba(99,102,241,0.04)",
        tableHeaderBg: "rgba(99,102,241,0.08)",
      };
}

// ─── DATA ───

const cases = [
  { code: 200, label: "OK", handler: "handleSuccess()" },
  { code: 301, label: "Redirect", handler: "handleRedirect()" },
  { code: 404, label: "Not Found", handler: "handleNotFound()" },
  { code: 500, label: "Server Error", handler: "handleServerError()" },
];

// ─── COMPONENT ───

export default function JumpTableVisualizer({ lang = "es" }: { lang?: Lang }) {
  const l = lang === "es";
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>("ifelse");
  const [selectedCode, setSelectedCode] = useState(404);
  const [animStep, setAnimStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  const matchIndex = cases.findIndex((c) => c.code === selectedCode);

  const runAnimation = (newCode: number) => {
    setSelectedCode(newCode);
    setIsAnimating(true);
    setAnimStep(0);

    const idx = cases.findIndex((c) => c.code === newCode);

    if (mode === "ifelse") {
      // Animate through each comparison step
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step > idx) {
          clearInterval(interval);
          setIsAnimating(false);
        }
        setAnimStep(step);
      }, 500);
    } else {
      // Jump table: instant jump
      setTimeout(() => {
        setAnimStep(idx);
        setTimeout(() => setIsAnimating(false), 300);
      }, 200);
    }
  };

  const getIfElseSteps = (): EvalStep[] => {
    return cases.map((c, i) => {
      const isMatch = c.code === selectedCode;
      const hasBeenEvaluated = animStep >= i;
      const isCurrentEval = animStep === i && isAnimating;

      return {
        label: `${c.code} == ${selectedCode}?`,
        address: c.handler,
        active: isCurrentEval,
        match: isMatch && hasBeenEvaluated,
        skipped: !isMatch && hasBeenEvaluated && !isCurrentEval,
      };
    });
  };

  const getJumpTableSteps = (): EvalStep[] => {
    return cases.map((c, i) => {
      const isMatch = c.code === selectedCode;
      const isJumpTarget = animStep === i && !isAnimating;

      return {
        label: `[${c.code}]`,
        address: c.handler,
        active: false,
        match: isMatch && (isJumpTarget || !isAnimating),
        skipped: false,
      };
    });
  };

  const steps = mode === "ifelse" ? getIfElseSteps() : getJumpTableSteps();
  const comparisons =
    mode === "ifelse" ? matchIndex + 1 : 1;

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
          {l ? "If/Else vs Jump Table" : "If/Else vs Jump Table"}
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
            ? "Selecciona un status code y observa cómo el procesador lo resuelve."
            : "Select a status code and watch how the processor resolves it."}
        </p>
      </div>

      {/* Mode toggle */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
          justifyContent: "center",
          background: theme.surface,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          margin: "0 auto 16px",
          border: `1px solid ${theme.border}`,
        }}
      >
        {(["ifelse", "jumptable"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setAnimStep(-1);
              setIsAnimating(false);
            }}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: mode === m ? theme.stepActiveBg : "transparent",
              color: mode === m ? theme.stepActiveText : theme.stepText,
              fontSize: 13,
              fontWeight: mode === m ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            {m === "ifelse" ? "if/else" : "Jump Table"}
          </button>
        ))}
      </div>

      {/* Status code selector */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {cases.map((c) => (
          <button
            key={c.code}
            onClick={() => !isAnimating && runAnimation(c.code)}
            disabled={isAnimating}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: `2px solid ${selectedCode === c.code && !isAnimating ? theme.matchBorder : theme.border}`,
              background:
                selectedCode === c.code && !isAnimating
                  ? theme.matchBg
                  : theme.surface,
              color:
                selectedCode === c.code && !isAnimating
                  ? theme.matchText
                  : theme.textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: isAnimating ? "wait" : "pointer",
              transition: "all 0.2s",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              opacity: isAnimating ? 0.6 : 1,
            }}
          >
            {c.code}
            <span
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 400,
                marginTop: 2,
                opacity: 0.7,
              }}
            >
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Visualization */}
      <div
        style={{
          background: theme.surface,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          padding: 20,
          marginBottom: 16,
        }}
      >
        {/* Mode description */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: theme.accentText,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 16,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            textAlign: "center",
          }}
        >
          {mode === "ifelse"
            ? l
              ? "Cadena de comparaciones — O(n)"
              : "Comparison chain — O(n)"
            : l
              ? "Tabla de salto — O(1)"
              : "Jump table — O(1)"}
        </div>

        {mode === "jumptable" && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: theme.tableBg,
              borderRadius: 8,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 11,
              color: theme.textMuted,
              textAlign: "center",
            }}
          >
            {l
              ? `table[${selectedCode}] → saltar directo a la dirección`
              : `table[${selectedCode}] → jump directly to address`}
          </div>
        )}

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {steps.map((step, i) => {
            let bg = theme.surface;
            let borderColor = theme.border;
            let textColor = theme.textMuted;
            let icon = "";

            if (step.match) {
              bg = theme.matchBg;
              borderColor = theme.matchBorder;
              textColor = theme.matchText;
              icon = "✓";
            } else if (step.active) {
              bg = theme.evalBg;
              borderColor = theme.evalBorder;
              textColor = theme.evalText;
              icon = "→";
            } else if (step.skipped) {
              textColor = theme.skipText;
              icon = "✗";
            }

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `2px solid ${borderColor}`,
                  background: bg,
                  transition: "all 0.3s ease",
                  opacity: step.skipped ? 0.45 : 1,
                }}
              >
                {/* Icon */}
                <span
                  style={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: textColor,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </span>

                {/* Label */}
                <span
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    color: textColor,
                    flex: 1,
                    transition: "color 0.3s",
                  }}
                >
                  {step.label}
                </span>

                {/* Arrow + handler */}
                <span
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: 12,
                    color: step.match ? theme.matchText : theme.textFaint,
                    fontWeight: step.match ? 700 : 400,
                    transition: "all 0.3s",
                  }}
                >
                  → {step.address}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            textAlign: "center",
            flex: 1,
            maxWidth: 200,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: theme.textFaint,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {l ? "Comparaciones" : "Comparisons"}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color:
                mode === "jumptable" ? theme.matchText : theme.accentText,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            {!isAnimating ? comparisons : "..."}
          </div>
        </div>
        <div
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            textAlign: "center",
            flex: 1,
            maxWidth: 200,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: theme.textFaint,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {l ? "Complejidad" : "Complexity"}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color:
                mode === "jumptable" ? theme.matchText : theme.accentText,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            {mode === "ifelse" ? "O(n)" : "O(1)"}
          </div>
        </div>
      </div>
    </div>
  );
}
