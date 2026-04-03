import { useState, useEffect } from "react";

type Lang = "es" | "en";

interface ObjectNode {
  id: string;
  label: string;
  type: string;
  refCount: number;
  color: string;
  freed: boolean;
}

interface Reference {
  from: string;
  to: string;
  kind: "strong" | "weak";
}

interface Scenario {
  title: string;
  description: string;
  steps: ScenarioStep[];
}

interface ScenarioStep {
  title: string;
  description: string;
  code: string;
  objects: ObjectNode[];
  references: Reference[];
  explanation: string;
}

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
        badgeBg: "rgba(249,115,22,0.15)", badgeText: "#fb923c", accentText: "#f97316",
        btnActiveBg: "#3f3f46", btnActiveText: "#fff", btnBg: "#27272a", btnText: "#a1a1aa",
        btnBorder: "rgba(255,255,255,0.08)",
        freedBg: "rgba(239,68,68,0.1)", freedBorder: "rgba(239,68,68,0.3)", freedText: "#f87171",
        strongArrow: "#f97316", weakArrow: "#22c55e",
        refCountBg: "rgba(99,102,241,0.2)", refCountText: "#818cf8",
        dangerBg: "rgba(239,68,68,0.12)", dangerText: "#f87171",
        successBg: "rgba(34,197,94,0.12)", successText: "#4ade80",
        codeBg: "#0d1117",
      }
    : {
        bg: "#fff", surface: "#F8F8F5", border: "rgba(0,0,0,0.06)",
        text: "#333", textMuted: "#666", textFaint: "#999",
        badgeBg: "rgba(234,88,12,0.1)", badgeText: "#ea580c", accentText: "#ea580c",
        btnActiveBg: "#1a1a1a", btnActiveText: "#fff", btnBg: "#f5f5f0", btnText: "#666",
        btnBorder: "rgba(0,0,0,0.08)",
        freedBg: "rgba(220,38,38,0.06)", freedBorder: "rgba(220,38,38,0.2)", freedText: "#dc2626",
        strongArrow: "#ea580c", weakArrow: "#16a34a",
        refCountBg: "rgba(99,102,241,0.1)", refCountText: "#6366f1",
        dangerBg: "rgba(220,38,38,0.06)", dangerText: "#dc2626",
        successBg: "rgba(22,163,74,0.08)", successText: "#16a34a",
        codeBg: "#1a1b26",
      };
}

function getScenarios(l: boolean): Scenario[] {
  return [
    {
      title: l ? "ARC en acción" : "ARC in action",
      description: l
        ? "Observa cómo el reference count sube y baja conforme se crean y destruyen referencias."
        : "Watch how the reference count goes up and down as references are created and destroyed.",
      steps: [
        {
          title: l ? "Crear objeto" : "Create object",
          description: l ? "Se crea un objeto Person en el Heap. ARC inicializa refCount en 1." : "A Person object is created on the Heap. ARC initializes refCount to 1.",
          code: `class Person {\n    let name: String\n    init(name: String) { self.name = name }\n    deinit { print("\\(name) freed") }\n}\n\nvar ref1: Person? = Person(name: "Juan")`,
          objects: [{ id: "person", label: "Person", type: "\"Juan\"", refCount: 1, color: "#6366f1", freed: false }],
          references: [{ from: "ref1", to: "person", kind: "strong" }],
          explanation: l ? "malloc asigna memoria en el Heap. refCount = 1 porque ref1 apunta al objeto." : "malloc allocates memory on the Heap. refCount = 1 because ref1 points to the object.",
        },
        {
          title: l ? "Segunda referencia" : "Second reference",
          description: l ? "Una nueva variable apunta al mismo objeto. refCount sube a 2." : "A new variable points to the same object. refCount goes up to 2.",
          code: `var ref1: Person? = Person(name: "Juan")\nvar ref2: Person? = ref1  // +1 reference`,
          objects: [{ id: "person", label: "Person", type: "\"Juan\"", refCount: 2, color: "#6366f1", freed: false }],
          references: [{ from: "ref1", to: "person", kind: "strong" }, { from: "ref2", to: "person", kind: "strong" }],
          explanation: l ? "Copiar una referencia no copia el objeto — solo incrementa refCount." : "Copying a reference doesn't copy the object — it only increments refCount.",
        },
        {
          title: l ? "Soltar ref1" : "Release ref1",
          description: l ? "ref1 = nil. refCount baja a 1. El objeto sigue vivo porque ref2 aún lo apunta." : "ref1 = nil. refCount drops to 1. The object stays alive because ref2 still points to it.",
          code: `ref1 = nil  // -1 reference\n// ref2 still points to Person`,
          objects: [{ id: "person", label: "Person", type: "\"Juan\"", refCount: 1, color: "#6366f1", freed: false }],
          references: [{ from: "ref2", to: "person", kind: "strong" }],
          explanation: l ? "ARC decrementa refCount. Como refCount > 0, el objeto NO se libera." : "ARC decrements refCount. Since refCount > 0, the object is NOT freed.",
        },
        {
          title: l ? "Soltar ref2 → free" : "Release ref2 → free",
          description: l ? "ref2 = nil. refCount llega a 0. ARC llama deinit y luego free()." : "ref2 = nil. refCount reaches 0. ARC calls deinit and then free().",
          code: `ref2 = nil  // -1 reference → refCount == 0\n// "Juan freed" printed\n// free() called — memory returned to Heap`,
          objects: [{ id: "person", label: "Person", type: "\"Juan\"", refCount: 0, color: "#6366f1", freed: true }],
          references: [],
          explanation: l ? "refCount == 0 → deinit se ejecuta → free() devuelve la memoria al Heap. Ciclo completo." : "refCount == 0 → deinit runs → free() returns memory to Heap. Full cycle.",
        },
      ],
    },
    {
      title: l ? "Retain Cycle" : "Retain Cycle",
      description: l
        ? "Dos objetos se apuntan mutuamente con referencias strong. Ninguno puede liberarse."
        : "Two objects point to each other with strong references. Neither can be freed.",
      steps: [
        {
          title: l ? "Crear ViewController" : "Create ViewController",
          description: l ? "Se crea un ViewController con un delegate strong." : "A ViewController with a strong delegate is created.",
          code: `class ViewController {\n    var delegate: Delegate?\n    deinit { print("VC freed") }\n}\n\nclass Delegate {\n    var viewController: ViewController?\n    deinit { print("Delegate freed") }\n}\n\nvar vc: ViewController? = ViewController()`,
          objects: [{ id: "vc", label: "ViewController", type: "", refCount: 1, color: "#6366f1", freed: false }],
          references: [{ from: "var vc", to: "vc", kind: "strong" }],
          explanation: l ? "Un ViewController normal, refCount = 1." : "A normal ViewController, refCount = 1.",
        },
        {
          title: l ? "Crear Delegate" : "Create Delegate",
          description: l ? "Se crea el delegate y se conectan mutuamente." : "The delegate is created and they're connected to each other.",
          code: `var del: Delegate? = Delegate()\nvc?.delegate = del      // vc → del (strong)\ndel?.viewController = vc // del → vc (strong)`,
          objects: [
            { id: "vc", label: "ViewController", type: "", refCount: 2, color: "#6366f1", freed: false },
            { id: "del", label: "Delegate", type: "", refCount: 2, color: "#06b6d4", freed: false },
          ],
          references: [
            { from: "var vc", to: "vc", kind: "strong" },
            { from: "var del", to: "del", kind: "strong" },
            { from: "vc", to: "del", kind: "strong" },
            { from: "del", to: "vc", kind: "strong" },
          ],
          explanation: l ? "Ambos tienen refCount = 2: una de la variable local y una del otro objeto." : "Both have refCount = 2: one from the local variable and one from the other object.",
        },
        {
          title: l ? "Soltar variables" : "Release variables",
          description: l ? "Soltamos las variables locales. Pero los objetos NO se liberan." : "We release the local variables. But the objects are NOT freed.",
          code: `vc = nil   // refCount: 2 → 1 (still > 0!)\ndel = nil  // refCount: 2 → 1 (still > 0!)\n// Neither deinit is called\n// MEMORY LEAK`,
          objects: [
            { id: "vc", label: "ViewController", type: "", refCount: 1, color: "#6366f1", freed: false },
            { id: "del", label: "Delegate", type: "", refCount: 1, color: "#06b6d4", freed: false },
          ],
          references: [
            { from: "vc", to: "del", kind: "strong" },
            { from: "del", to: "vc", kind: "strong" },
          ],
          explanation: l
            ? "refCount baja a 1 pero nunca a 0. Se apuntan mutuamente en un ciclo. La memoria queda atrapada para siempre — es un memory leak."
            : "refCount drops to 1 but never to 0. They point to each other in a cycle. Memory is trapped forever — it's a memory leak.",
        },
      ],
    },
    {
      title: l ? "La solución: weak" : "The fix: weak",
      description: l
        ? "Usando weak rompemos el ciclo. El delegate no incrementa el refCount del ViewController."
        : "Using weak breaks the cycle. The delegate doesn't increment the ViewController's refCount.",
      steps: [
        {
          title: l ? "weak reference" : "weak reference",
          description: l ? "El delegate apunta al ViewController con weak — no incrementa refCount." : "The delegate points to ViewController with weak — it doesn't increment refCount.",
          code: `class Delegate {\n    weak var viewController: ViewController? // weak!\n    deinit { print("Delegate freed") }\n}\n\nvar vc: ViewController? = ViewController()\nvar del: Delegate? = Delegate()\nvc?.delegate = del\ndel?.viewController = vc`,
          objects: [
            { id: "vc", label: "ViewController", type: "", refCount: 1, color: "#6366f1", freed: false },
            { id: "del", label: "Delegate", type: "", refCount: 2, color: "#06b6d4", freed: false },
          ],
          references: [
            { from: "var vc", to: "vc", kind: "strong" },
            { from: "var del", to: "del", kind: "strong" },
            { from: "vc", to: "del", kind: "strong" },
            { from: "del", to: "vc", kind: "weak" },
          ],
          explanation: l
            ? "VC tiene refCount = 1 (solo var vc). La referencia weak de Delegate NO cuenta. Delegate tiene refCount = 2."
            : "VC has refCount = 1 (only var vc). The weak reference from Delegate does NOT count. Delegate has refCount = 2.",
        },
        {
          title: l ? "Soltar vc" : "Release vc",
          description: l ? "vc = nil. refCount del VC llega a 0. Se libera. La weak reference se vuelve nil automáticamente." : "vc = nil. VC's refCount reaches 0. It's freed. The weak reference becomes nil automatically.",
          code: `vc = nil  // VC refCount: 1 → 0 → freed!\n// del?.viewController is now nil (automatic)`,
          objects: [
            { id: "vc", label: "ViewController", type: "", refCount: 0, color: "#6366f1", freed: true },
            { id: "del", label: "Delegate", type: "", refCount: 1, color: "#06b6d4", freed: false },
          ],
          references: [
            { from: "var del", to: "del", kind: "strong" },
          ],
          explanation: l
            ? "El VC se libera. ARC automáticamente pone la weak reference a nil. No hay ciclo. Delegate queda con refCount = 1."
            : "VC is freed. ARC automatically sets the weak reference to nil. No cycle. Delegate remains with refCount = 1.",
        },
        {
          title: l ? "Soltar del → limpio" : "Release del → clean",
          description: l ? "del = nil. Delegate se libera. Toda la memoria está limpia." : "del = nil. Delegate is freed. All memory is clean.",
          code: `del = nil  // Delegate refCount: 1 → 0 → freed!\n// Both objects properly deallocated\n// Zero memory leaks ✅`,
          objects: [
            { id: "vc", label: "ViewController", type: "", refCount: 0, color: "#6366f1", freed: true },
            { id: "del", label: "Delegate", type: "", refCount: 0, color: "#06b6d4", freed: true },
          ],
          references: [],
          explanation: l
            ? "Ambos objetos liberados correctamente. free() devolvió la memoria al Heap. Sin leaks."
            : "Both objects freed correctly. free() returned memory to the Heap. No leaks.",
        },
      ],
    },
  ];
}

export default function ARCSimulator({ lang = "es" }: { lang?: Lang }) {
  const l = lang === "es";
  const theme = useTheme();
  const scenarios = getScenarios(l);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const scenario = scenarios[scenarioIndex];
  const step = scenario.steps[stepIndex];

  const changeScenario = (i: number) => {
    setScenarioIndex(i);
    setStepIndex(0);
  };

  const hasRetainCycle = step.references.some(
    (r) => r.kind === "strong" && step.references.some((r2) => r2.from === r.to && r2.to === r.from && r2.kind === "strong")
  );
  const allFreed = step.objects.every((o) => o.freed);

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
        <h3 style={{ margin: "12px 0 4px", fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>
          {l ? "ARC: el contador invisible" : "ARC: the invisible counter"}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>
          {l
            ? "Explora cómo ARC gestiona la memoria, y qué pasa cuando se forma un retain cycle."
            : "Explore how ARC manages memory, and what happens when a retain cycle forms."}
        </p>
      </div>

      {/* Scenario tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => changeScenario(i)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${i === scenarioIndex ? "transparent" : theme.btnBorder}`,
              background: i === scenarioIndex ? theme.btnActiveBg : theme.btnBg,
              color: i === scenarioIndex ? theme.btnActiveText : theme.btnText,
              fontSize: 12,
              fontWeight: i === scenarioIndex ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Step buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {scenario.steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStepIndex(i)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${i === stepIndex ? theme.accentText : theme.btnBorder}`,
              background: i === stepIndex ? theme.badgeBg : "transparent",
              color: i === stepIndex ? theme.accentText : theme.textMuted,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div
        className="arc-sim-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}
      >
        {/* Code */}
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${theme.border}`,
            background: theme.codeBg,
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              fontSize: 11,
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              borderBottom: `1px solid ${theme.border}`,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            Swift
          </div>
          <pre
            style={{
              margin: 0,
              padding: "14px 16px",
              fontSize: 12,
              lineHeight: 1.75,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              color: "#e4e4e7",
              overflow: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {step.code}
          </pre>
        </div>

        {/* Object graph */}
        <div
          style={{
            background: theme.surface,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            padding: 16,
            minHeight: 250,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.textFaint,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Heap
          </div>

          {/* Objects */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {step.objects.map((obj) => (
              <div
                key={obj.id}
                style={{
                  borderRadius: 10,
                  border: `2px solid ${obj.freed ? theme.freedBorder : obj.color}`,
                  overflow: "hidden",
                  opacity: obj.freed ? 0.5 : 1,
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
              >
                {obj.freed && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: theme.freedBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                      fontSize: 12,
                      fontWeight: 800,
                      color: theme.freedText,
                      fontFamily: "'SF Mono', monospace",
                      letterSpacing: 1,
                    }}
                  >
                    free()
                  </div>
                )}

                <div
                  style={{
                    padding: "6px 10px",
                    background: obj.freed ? theme.freedBg : obj.color,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'SF Mono', monospace" }}>
                    {obj.label}
                  </span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: obj.refCount === 0 ? "rgba(239,68,68,0.3)" : theme.refCountBg,
                      fontSize: 10,
                      fontWeight: 800,
                      color: obj.refCount === 0 ? "#fca5a5" : theme.refCountText,
                      fontFamily: "'SF Mono', monospace",
                    }}
                  >
                    refCount: {obj.refCount}
                  </span>
                </div>

                {obj.type && (
                  <div style={{ padding: "6px 10px", fontSize: 11, color: theme.textMuted, fontFamily: "'SF Mono', monospace" }}>
                    {obj.type}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* References legend */}
          {step.references.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
              {step.references.map((ref, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 10,
                    color: theme.textMuted,
                    fontFamily: "'SF Mono', monospace",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 2,
                      background: ref.kind === "strong" ? theme.strongArrow : theme.weakArrow,
                      display: "inline-block",
                      borderRadius: 1,
                      borderBottom: ref.kind === "weak" ? "1px dashed" : "none",
                    }}
                  />
                  <span>{ref.from} → {ref.to}</span>
                  <span
                    style={{
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: ref.kind === "strong" ? theme.dangerBg : theme.successBg,
                      color: ref.kind === "strong" ? theme.dangerText : theme.successText,
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {ref.kind}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Status indicator */}
          {(hasRetainCycle || allFreed) && (
            <div
              style={{
                marginTop: 14,
                padding: "8px 12px",
                borderRadius: 8,
                background: hasRetainCycle ? theme.dangerBg : theme.successBg,
                fontSize: 12,
                fontWeight: 700,
                color: hasRetainCycle ? theme.dangerText : theme.successText,
                textAlign: "center",
              }}
            >
              {hasRetainCycle
                ? (l ? "⚠️ Retain Cycle — memory leak!" : "⚠️ Retain Cycle — memory leak!")
                : (l ? "✅ Memoria limpia — sin leaks" : "✅ Clean memory — no leaks")}
            </div>
          )}
        </div>
      </div>

      {/* Step explanation */}
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
          {l ? `Paso ${stepIndex + 1}/${scenario.steps.length}` : `Step ${stepIndex + 1}/${scenario.steps.length}`}
        </span>
        {step.explanation}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <button
          onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
          disabled={stepIndex === 0}
          style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.btnBorder}`,
            background: stepIndex === 0 ? "transparent" : theme.btnBg,
            color: stepIndex === 0 ? theme.textFaint : theme.textMuted,
            fontSize: 13, fontWeight: 600, cursor: stepIndex === 0 ? "default" : "pointer",
            fontFamily: "inherit", opacity: stepIndex === 0 ? 0.4 : 1,
          }}
        >
          ← {l ? "Anterior" : "Previous"}
        </button>
        <button
          onClick={() => setStepIndex(Math.min(scenario.steps.length - 1, stepIndex + 1))}
          disabled={stepIndex === scenario.steps.length - 1}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid transparent",
            background: stepIndex === scenario.steps.length - 1 ? theme.btnBg : theme.btnActiveBg,
            color: stepIndex === scenario.steps.length - 1 ? theme.textFaint : theme.btnActiveText,
            fontSize: 13, fontWeight: 600,
            cursor: stepIndex === scenario.steps.length - 1 ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: stepIndex === scenario.steps.length - 1 ? 0.4 : 1,
          }}
        >
          {l ? "Siguiente" : "Next"} →
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .arc-sim-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
