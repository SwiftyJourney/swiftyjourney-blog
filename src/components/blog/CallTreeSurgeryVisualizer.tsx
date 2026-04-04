import { useState, useEffect } from "react";

// ─── TYPES ───

type Lang = "es" | "en";

interface TreeNode {
  id: string;
  name: string;
  weight: number;
  selfWeight: number;
  depth: number;
  children?: string[];
  highlight?: boolean;
  faded?: boolean;
  removed?: boolean;
}

interface OperationStep {
  title: string;
  description: string;
  explanation: string;
  nodes: TreeNode[];
  targetId?: string;
}

interface Operation {
  title: string;
  description: string;
  steps: OperationStep[];
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
        badgeBg: "rgba(249,115,22,0.15)",
        badgeText: "#fb923c",
        accentText: "#f97316",
        btnActiveBg: "#3f3f46",
        btnActiveText: "#fff",
        btnBg: "#27272a",
        btnText: "#a1a1aa",
        btnBorder: "rgba(255,255,255,0.08)",
        nodeBg: "rgba(255,255,255,0.04)",
        nodeBorder: "rgba(255,255,255,0.08)",
        nodeHighlight: "rgba(249,115,22,0.15)",
        nodeHighlightBorder: "rgba(249,115,22,0.4)",
        removedBg: "rgba(239,68,68,0.08)",
        removedBorder: "rgba(239,68,68,0.25)",
        removedText: "#f87171",
        barColor: "#f97316",
        barBg: "rgba(255,255,255,0.06)",
        selfBarColor: "#818cf8",
        labelBg: "rgba(99,102,241,0.2)",
        labelText: "#818cf8",
        successBg: "rgba(34,197,94,0.12)",
        successText: "#4ade80",
        warningBg: "rgba(234,179,8,0.12)",
        warningText: "#facc15",
      }
    : {
        bg: "#fff",
        surface: "#F8F8F5",
        border: "rgba(0,0,0,0.06)",
        text: "#333",
        textMuted: "#666",
        textFaint: "#999",
        badgeBg: "rgba(234,88,12,0.1)",
        badgeText: "#ea580c",
        accentText: "#ea580c",
        btnActiveBg: "#1a1a1a",
        btnActiveText: "#fff",
        btnBg: "#f5f5f0",
        btnText: "#666",
        btnBorder: "rgba(0,0,0,0.08)",
        nodeBg: "rgba(0,0,0,0.02)",
        nodeBorder: "rgba(0,0,0,0.06)",
        nodeHighlight: "rgba(234,88,12,0.08)",
        nodeHighlightBorder: "rgba(234,88,12,0.35)",
        removedBg: "rgba(220,38,38,0.05)",
        removedBorder: "rgba(220,38,38,0.2)",
        removedText: "#dc2626",
        barColor: "#ea580c",
        barBg: "rgba(0,0,0,0.04)",
        selfBarColor: "#6366f1",
        labelBg: "rgba(99,102,241,0.1)",
        labelText: "#6366f1",
        successBg: "rgba(22,163,74,0.08)",
        successText: "#16a34a",
        warningBg: "rgba(202,138,4,0.08)",
        warningText: "#ca8a04",
      };
}

// ─── DATA ───

const MAX_WEIGHT = 850;

function baseNodes(): TreeNode[] {
  return [
    { id: "cell", name: "tableView(_:cellForRowAt:)", weight: 850, selfWeight: 5, depth: 0 },
    { id: "getter", name: "PeopleStore.people.getter", weight: 840, selfWeight: 10, depth: 1, children: ["decode", "data"] },
    { id: "decode", name: "JSONDecoder.decode(_:from:)", weight: 620, selfWeight: 15, depth: 2, children: ["unbox"] },
    { id: "unbox", name: "__JSONDecoder.unbox()", weight: 600, selfWeight: 580, depth: 3 },
    { id: "data", name: "Data(contentsOf:)", weight: 210, selfWeight: 200, depth: 2 },
  ];
}

function getOperations(l: boolean): Operation[] {
  return [
    {
      title: "Flatten",
      description: l
        ? "Elimina una función intermedia y sube sus hijos al padre."
        : "Removes an intermediate function and moves its children to the parent.",
      steps: [
        {
          title: l ? "Árbol original" : "Original tree",
          description: l
            ? "El Call Tree sin modificar. JSONDecoder.decode es un intermediario — tiene Weight alto (620ms) pero Self-Weight bajo (15ms). El trabajo real está en su hijo unbox()."
            : "The unmodified Call Tree. JSONDecoder.decode is an intermediary — it has high Weight (620ms) but low Self-Weight (15ms). The real work is in its child unbox().",
          explanation: l
            ? "Observa cómo decode actúa de 'puente' entre el getter y unbox. Su Self-Weight de 15ms confirma que casi no hace trabajo propio."
            : "Notice how decode acts as a 'bridge' between the getter and unbox. Its Self-Weight of 15ms confirms it does almost no work itself.",
          nodes: baseNodes(),
        },
        {
          title: l ? "Seleccionar objetivo" : "Select target",
          description: l
            ? "Seleccionamos JSONDecoder.decode como objetivo de Flatten. Al aplicarlo, esta función desaparecerá y su hijo unbox() subirá directamente bajo el getter."
            : "We select JSONDecoder.decode as the Flatten target. When applied, this function will disappear and its child unbox() will move directly under the getter.",
          explanation: l
            ? "En Instruments: clic derecho sobre la función → Flatten. Ideal para wrappers, protocol witness thunks o funciones intermedias que solo 'pasan' la llamada."
            : "In Instruments: right-click the function → Flatten. Ideal for wrappers, protocol witness thunks, or intermediate functions that just 'pass through' the call.",
          nodes: baseNodes().map((n) =>
            n.id === "decode" ? { ...n, highlight: true } : n
          ),
          targetId: "decode",
        },
        {
          title: l ? "Resultado" : "Result",
          description: l
            ? "decode desapareció. unbox() ahora es hijo directo de PeopleStore.people.getter. El árbol es más limpio y la jerarquía refleja mejor dónde está el trabajo real."
            : "decode is gone. unbox() is now a direct child of PeopleStore.people.getter. The tree is cleaner and the hierarchy better reflects where the real work is.",
          explanation: l
            ? "El Weight del getter no cambió (840ms) — Flatten no elimina tiempo, solo simplifica la estructura. Los 15ms de Self de decode se redistribuyen al padre."
            : "The getter's Weight didn't change (840ms) — Flatten doesn't remove time, it just simplifies the structure. decode's 15ms Self-Weight is redistributed to the parent.",
          nodes: [
            { id: "cell", name: "tableView(_:cellForRowAt:)", weight: 850, selfWeight: 5, depth: 0 },
            { id: "getter", name: "PeopleStore.people.getter", weight: 840, selfWeight: 25, depth: 1, children: ["unbox", "data"] },
            { id: "unbox", name: "__JSONDecoder.unbox()", weight: 600, selfWeight: 580, depth: 2 },
            { id: "data", name: "Data(contentsOf:)", weight: 210, selfWeight: 200, depth: 2 },
          ],
        },
      ],
    },
    {
      title: "Prune",
      description: l
        ? "Elimina una función y todos sus descendientes del análisis."
        : "Removes a function and all its descendants from the analysis.",
      steps: [
        {
          title: l ? "Árbol original" : "Original tree",
          description: l
            ? "El Call Tree completo. Sabemos que Data(contentsOf:) es I/O de disco y no es nuestro foco de optimización. Queremos eliminarlo para concentrarnos en la decodificación."
            : "The full Call Tree. We know Data(contentsOf:) is disk I/O and not our optimization focus. We want to remove it to concentrate on decoding.",
          explanation: l
            ? "Data(contentsOf:) consume 210ms — es significativo, pero ya sabemos que leer el archivo es inevitable. Queremos limpiar el ruido."
            : "Data(contentsOf:) takes 210ms — it's significant, but we already know reading the file is unavoidable. We want to clean up the noise.",
          nodes: baseNodes(),
        },
        {
          title: l ? "Seleccionar objetivo" : "Select target",
          description: l
            ? "Seleccionamos Data(contentsOf:) para Prune. Al aplicarlo, esta función y todo su subárbol desaparecerán completamente del análisis."
            : "We select Data(contentsOf:) for Prune. When applied, this function and its entire subtree will completely disappear from the analysis.",
          explanation: l
            ? "En Instruments: clic derecho → Prune. Atención: el tiempo se elimina del análisis. Si el Weight total ya no cuadra, recuerda que podaste una rama."
            : "In Instruments: right-click → Prune. Warning: the time is removed from the analysis. If the total Weight no longer adds up, remember you pruned a branch.",
          nodes: baseNodes().map((n) =>
            n.id === "data" ? { ...n, highlight: true } : n
          ),
          targetId: "data",
        },
        {
          title: l ? "Resultado" : "Result",
          description: l
            ? "Data(contentsOf:) desapareció con todo su subárbol. El Weight del getter bajó de 840ms a 630ms. El análisis ahora se enfoca exclusivamente en la decodificación JSON."
            : "Data(contentsOf:) is gone along with its entire subtree. The getter's Weight dropped from 840ms to 630ms. The analysis now focuses exclusively on JSON decoding.",
          explanation: l
            ? "Prune es destructivo para el análisis actual — no puedes 'des-podar'. Si necesitas ver Data(contentsOf:) de nuevo, tendrás que volver al trace original. Úsalo con confianza, pero con intención."
            : "Prune is destructive for the current analysis — you can't 'un-prune'. If you need to see Data(contentsOf:) again, you'll need to go back to the original trace. Use it with confidence, but with intention.",
          nodes: [
            { id: "cell", name: "tableView(_:cellForRowAt:)", weight: 640, selfWeight: 5, depth: 0 },
            { id: "getter", name: "PeopleStore.people.getter", weight: 630, selfWeight: 10, depth: 1, children: ["decode"] },
            { id: "decode", name: "JSONDecoder.decode(_:from:)", weight: 620, selfWeight: 15, depth: 2, children: ["unbox"] },
            { id: "unbox", name: "__JSONDecoder.unbox()", weight: 600, selfWeight: 580, depth: 3 },
          ],
        },
      ],
    },
    {
      title: "Charge",
      description: l
        ? "Colapsa todos los hijos en la función padre — la convierte en una caja negra."
        : "Collapses all children into the parent function — turns it into a black box.",
      steps: [
        {
          title: l ? "Árbol original" : "Original tree",
          description: l
            ? "El Call Tree completo. PeopleStore.people.getter tiene Weight de 840ms pero Self-Weight de solo 10ms — su costo real está repartido entre sus descendientes."
            : "The full Call Tree. PeopleStore.people.getter has a Weight of 840ms but Self-Weight of only 10ms — its real cost is spread across its descendants.",
          explanation: l
            ? "A veces no necesitas saber los detalles internos. Solo quieres saber: '¿cuánto cuesta esta operación en total?' Charge responde esa pregunta."
            : "Sometimes you don't need to know the internal details. You just want to know: 'what's the total cost of this operation?' Charge answers that question.",
          nodes: baseNodes(),
        },
        {
          title: l ? "Seleccionar objetivo" : "Select target",
          description: l
            ? "Seleccionamos PeopleStore.people.getter para Charge. Al aplicarlo, todos sus descendientes desaparecerán y su Self-Weight absorberá todo el tiempo."
            : "We select PeopleStore.people.getter for Charge. When applied, all its descendants will disappear and its Self-Weight will absorb all the time.",
          explanation: l
            ? "En Instruments: clic derecho → Charge. Perfecto cuando ya identificaste al culpable y ahora quieres comparar su costo total con otras ramas del árbol."
            : "In Instruments: right-click → Charge. Perfect when you've already identified the culprit and now want to compare its total cost with other branches of the tree.",
          nodes: baseNodes().map((n) =>
            n.id === "getter" ? { ...n, highlight: true } : n
          ),
          targetId: "getter",
        },
        {
          title: l ? "Resultado" : "Result",
          description: l
            ? "PeopleStore.people.getter ahora muestra Self-Weight = 840ms (igual a su Weight). Es una caja negra: sabes exactamente cuánto cuesta, sin distraerte con los detalles internos."
            : "PeopleStore.people.getter now shows Self-Weight = 840ms (equal to its Weight). It's a black box: you know exactly how much it costs, without being distracted by internal details.",
          explanation: l
            ? "Charge no elimina tiempo del análisis (a diferencia de Prune). El Weight total del árbol sigue siendo el mismo. Solo consolida la vista."
            : "Charge doesn't remove time from the analysis (unlike Prune). The tree's total Weight stays the same. It just consolidates the view.",
          nodes: [
            { id: "cell", name: "tableView(_:cellForRowAt:)", weight: 850, selfWeight: 5, depth: 0 },
            { id: "getter", name: "PeopleStore.people.getter", weight: 840, selfWeight: 840, depth: 1 },
          ],
        },
      ],
    },
  ];
}

// ─── COMPONENT ───

function WeightBar({
  weight,
  selfWeight,
  maxWeight,
  theme,
  compact,
}: {
  weight: number;
  selfWeight: number;
  maxWeight: number;
  theme: ReturnType<typeof useTheme>;
  compact?: boolean;
}) {
  const widthPct = (weight / maxWeight) * 100;
  const selfPct = (selfWeight / maxWeight) * 100;
  const h = compact ? 6 : 8;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
      <div
        style={{
          flex: 1,
          height: h,
          borderRadius: h / 2,
          background: theme.barBg,
          position: "relative",
          overflow: "hidden",
          minWidth: 40,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${widthPct}%`,
            background: theme.barColor,
            borderRadius: h / 2,
            opacity: 0.3,
            transition: "width 0.4s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${selfPct}%`,
            background: theme.selfBarColor,
            borderRadius: h / 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 10,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          flexShrink: 0,
        }}
      >
        <span style={{ color: theme.barColor, fontWeight: 700 }}>{weight}ms</span>
        <span style={{ color: theme.selfBarColor, fontWeight: 700 }}>
          self: {selfWeight}ms
        </span>
      </div>
    </div>
  );
}

function TreeNodeRow({
  node,
  theme,
  isTarget,
  l,
}: {
  node: TreeNode;
  theme: ReturnType<typeof useTheme>;
  isTarget: boolean;
  l: boolean;
}) {
  const isRemoved = node.removed;
  const isHighlighted = node.highlight;

  let bg = theme.nodeBg;
  let border = theme.nodeBorder;
  let opacity = 1;

  if (isRemoved) {
    bg = theme.removedBg;
    border = theme.removedBorder;
    opacity = 0.45;
  } else if (isHighlighted) {
    bg = theme.nodeHighlight;
    border = theme.nodeHighlightBorder;
  }

  if (node.faded) opacity = 0.4;

  return (
    <div
      style={{
        marginLeft: node.depth * 20,
        padding: "8px 12px",
        borderRadius: 8,
        background: bg,
        border: `1.5px solid ${border}`,
        opacity,
        transition: "all 0.4s ease",
        marginBottom: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 4,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            color: isRemoved ? theme.removedText : isHighlighted ? theme.accentText : theme.text,
            transition: "color 0.3s ease",
            minWidth: 0,
            wordBreak: "break-all",
          }}
        >
          {isRemoved ? <s>{node.name}</s> : node.name}
        </span>
        {isTarget && !isRemoved && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 10,
              background: theme.warningBg,
              color: theme.warningText,
              fontFamily: "'SF Mono', monospace",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {l ? "objetivo" : "target"}
          </span>
        )}
      </div>
      <WeightBar
        weight={node.weight}
        selfWeight={node.selfWeight}
        maxWeight={MAX_WEIGHT}
        theme={theme}
        compact={node.depth > 1}
      />
    </div>
  );
}

export default function CallTreeSurgeryVisualizer({ lang = "es" }: { lang?: Lang }) {
  const l = lang === "es";
  const theme = useTheme();
  const operations = getOperations(l);
  const [opIndex, setOpIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const op = operations[opIndex];
  const step = op.steps[stepIndex];

  const changeOp = (i: number) => {
    setOpIndex(i);
    setStepIndex(0);
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
        <h3
          style={{
            margin: "12px 0 4px",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: -0.3,
          }}
        >
          {l ? "Cirugía del Call Tree" : "Call Tree Surgery"}
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
            ? "Experimenta con Flatten, Prune y Charge sobre un Call Tree real de SuperStuff."
            : "Experiment with Flatten, Prune, and Charge on a real SuperStuff Call Tree."}
        </p>
      </div>

      {/* Operation tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {operations.map((o, i) => (
          <button
            key={i}
            onClick={() => changeOp(i)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${i === opIndex ? "transparent" : theme.btnBorder}`,
              background: i === opIndex ? theme.btnActiveBg : theme.btnBg,
              color: i === opIndex ? theme.btnActiveText : theme.btnText,
              fontSize: 12,
              fontWeight: i === opIndex ? 700 : 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {o.title}
          </button>
        ))}
      </div>

      {/* Operation description */}
      <p
        style={{
          fontSize: 13,
          color: theme.textMuted,
          textAlign: "center",
          marginBottom: 16,
          fontStyle: "italic",
        }}
      >
        {op.description}
      </p>

      {/* Step tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {op.steps.map((s, i) => (
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

      {/* Step description */}
      <div
        style={{
          padding: "12px 16px",
          background: theme.surface,
          borderRadius: 10,
          border: `1px solid ${theme.border}`,
          marginBottom: 16,
          fontSize: 13,
          lineHeight: 1.6,
          color: theme.textMuted,
        }}
      >
        {step.description}
      </div>

      {/* Call Tree visualization */}
      <div
        style={{
          background: theme.surface,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          padding: 16,
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
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Call Tree</span>
          <div style={{ display: "flex", gap: 12, fontSize: 9, fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 12,
                  height: 6,
                  borderRadius: 3,
                  background: theme.barColor,
                  opacity: 0.4,
                  display: "inline-block",
                }}
              />
              Weight
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 12,
                  height: 6,
                  borderRadius: 3,
                  background: theme.selfBarColor,
                  display: "inline-block",
                }}
              />
              Self
            </span>
          </div>
        </div>

        {step.nodes.map((node) => (
          <TreeNodeRow
            key={node.id}
            node={node}
            theme={theme}
            isTarget={step.targetId === node.id}
            l={l}
          />
        ))}
      </div>

      {/* Explanation */}
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
          {l
            ? `Paso ${stepIndex + 1}/${op.steps.length}`
            : `Step ${stepIndex + 1}/${op.steps.length}`}
        </span>
        {step.explanation}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <button
          onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
          disabled={stepIndex === 0}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${theme.btnBorder}`,
            background: stepIndex === 0 ? "transparent" : theme.btnBg,
            color: stepIndex === 0 ? theme.textFaint : theme.textMuted,
            fontSize: 13,
            fontWeight: 600,
            cursor: stepIndex === 0 ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: stepIndex === 0 ? 0.4 : 1,
          }}
        >
          ← {l ? "Anterior" : "Previous"}
        </button>
        <button
          onClick={() => setStepIndex(Math.min(op.steps.length - 1, stepIndex + 1))}
          disabled={stepIndex === op.steps.length - 1}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid transparent",
            background:
              stepIndex === op.steps.length - 1
                ? theme.btnBg
                : theme.btnActiveBg,
            color:
              stepIndex === op.steps.length - 1
                ? theme.textFaint
                : theme.btnActiveText,
            fontSize: 13,
            fontWeight: 600,
            cursor:
              stepIndex === op.steps.length - 1 ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: stepIndex === op.steps.length - 1 ? 0.4 : 1,
          }}
        >
          {l ? "Siguiente" : "Next"} →
        </button>
      </div>
    </div>
  );
}
