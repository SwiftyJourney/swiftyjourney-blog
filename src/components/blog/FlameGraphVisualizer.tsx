import { useState, useEffect } from "react";

// ─── TYPES ───

type Lang = "es" | "en";

interface FlameNode {
  id: string;
  name: string;
  category: "app" | "library" | "system" | "runtime";
  samples: number;
  selfSamples: number;
  children?: FlameNode[];
  flattened?: boolean;
}

type ViewMode = "timeline" | "flamegraph";

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
        appColor: "#60a5fa",
        libraryColor: "#a78bfa",
        systemColor: "#6b7280",
        runtimeColor: "#f472b6",
        appColorBg: "rgba(96,165,250,0.85)",
        libraryColorBg: "rgba(167,139,250,0.85)",
        systemColorBg: "rgba(107,114,128,0.75)",
        runtimeColorBg: "rgba(244,114,182,0.85)",
        tooltipBg: "#3f3f46",
        tooltipText: "#e4e4e7",
        flattenBg: "rgba(34,197,94,0.12)",
        flattenText: "#4ade80",
        flattenBorder: "rgba(34,197,94,0.3)",
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
        appColor: "#3b82f6",
        libraryColor: "#8b5cf6",
        systemColor: "#9ca3af",
        runtimeColor: "#ec4899",
        appColorBg: "rgba(59,130,246,0.8)",
        libraryColorBg: "rgba(139,92,246,0.8)",
        systemColorBg: "rgba(156,163,175,0.7)",
        runtimeColorBg: "rgba(236,72,153,0.8)",
        tooltipBg: "#1a1a1a",
        tooltipText: "#fff",
        flattenBg: "rgba(22,163,74,0.08)",
        flattenText: "#16a34a",
        flattenBorder: "rgba(22,163,74,0.25)",
      };
}

// ─── DATA ───

const TOTAL_SAMPLES = 1000;

function buildTree(): FlameNode {
  return {
    id: "root",
    name: "ExtractionJob.run()",
    category: "app",
    samples: 1000,
    selfSamples: 15,
    children: [
      {
        id: "fetch",
        name: "GitHubFetcher.fetchProposalContents()",
        category: "app",
        samples: 280,
        selfSamples: 12,
        children: [
          {
            id: "urlsession",
            name: "URLSession.data(for:)",
            category: "system",
            samples: 250,
            selfSamples: 40,
            children: [
              {
                id: "http",
                name: "HTTPProtocol.startLoading()",
                category: "system",
                samples: 195,
                selfSamples: 195,
              },
            ],
          },
        ],
      },
      {
        id: "taskgroup",
        name: "withTaskGroup(of:returning:body:)",
        category: "runtime",
        samples: 680,
        selfSamples: 8,
        children: [
          {
            id: "extract",
            name: "readAndExtractProposalMetadata()",
            category: "app",
            samples: 660,
            selfSamples: 25,
            children: [
              {
                id: "markdownparse",
                name: "Document(parsing:options:)",
                category: "library",
                samples: 480,
                selfSamples: 30,
                children: [
                  {
                    id: "cmark",
                    name: "cmark_parser_feed()",
                    category: "library",
                    samples: 320,
                    selfSamples: 320,
                  },
                  {
                    id: "markupconv",
                    name: "MarkupConversion.convert()",
                    category: "library",
                    samples: 110,
                    selfSamples: 110,
                  },
                ],
              },
              {
                id: "fieldextract",
                name: "HeaderFieldExtractor.extract()",
                category: "app",
                samples: 120,
                selfSamples: 45,
                children: [
                  {
                    id: "statusparse",
                    name: "StatusExtractor.extract()",
                    category: "app",
                    samples: 42,
                    selfSamples: 42,
                  },
                  {
                    id: "personparse",
                    name: "PersonExtractor.extract()",
                    category: "app",
                    samples: 28,
                    selfSamples: 28,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

// ─── FLATTEN LOGIC ───

function flattenLibrary(node: FlameNode): FlameNode {
  if (node.category === "library") {
    const totalSamples = node.samples;
    return {
      ...node,
      name: "swift-markdown (flattened)",
      flattened: true,
      selfSamples: totalSamples,
      children: undefined,
    };
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map(flattenLibrary),
    };
  }
  return node;
}

// ─── FLATTEN ALL NODES FOR FLAME RENDERING ───

interface FlatBar {
  id: string;
  name: string;
  category: "app" | "library" | "system" | "runtime";
  samples: number;
  selfSamples: number;
  depth: number;
  xStart: number;
  width: number;
  flattened?: boolean;
}

function flattenToBarList(
  node: FlameNode,
  depth: number,
  xStart: number,
  totalSamples: number
): FlatBar[] {
  const width = (node.samples / totalSamples) * 100;
  const bars: FlatBar[] = [
    {
      id: node.id,
      name: node.name,
      category: node.category,
      samples: node.samples,
      selfSamples: node.selfSamples,
      depth,
      xStart,
      width,
      flattened: node.flattened,
    },
  ];

  if (node.children) {
    let childX = xStart;
    for (const child of node.children) {
      bars.push(...flattenToBarList(child, depth + 1, childX, totalSamples));
      childX += (child.samples / totalSamples) * 100;
    }
  }

  return bars;
}

// ─── TIMELINE VIEW ───

function TimelineRow({
  node,
  depth,
  theme,
  l,
}: {
  node: FlameNode;
  depth: number;
  theme: ReturnType<typeof useTheme>;
  l: boolean;
}) {
  const pct = ((node.samples / TOTAL_SAMPLES) * 100).toFixed(1);
  const selfPct = ((node.selfSamples / TOTAL_SAMPLES) * 100).toFixed(1);
  const catColors: Record<string, string> = {
    app: theme.appColor,
    library: theme.libraryColor,
    system: theme.systemColor,
    runtime: theme.runtimeColor,
  };

  return (
    <>
      <div
        style={{
          marginLeft: depth * 18,
          padding: "6px 10px",
          borderRadius: 6,
          background: node.flattened ? theme.flattenBg : "transparent",
          border: node.flattened
            ? `1px solid ${theme.flattenBorder}`
            : `1px solid ${theme.border}`,
          marginBottom: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: catColors[node.category],
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              color: node.flattened ? theme.flattenText : theme.text,
              wordBreak: "break-all",
              minWidth: 0,
            }}
          >
            {node.name}
          </span>
          {node.flattened && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                padding: "1px 6px",
                borderRadius: 8,
                background: theme.flattenBg,
                color: theme.flattenText,
                border: `1px solid ${theme.flattenBorder}`,
                flexShrink: 0,
              }}
            >
              FLATTENED
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 10,
            fontFamily: "'SF Mono', monospace",
            flexShrink: 0,
          }}
        >
          <span style={{ color: theme.textMuted }}>{pct}%</span>
          <span style={{ color: catColors[node.category], fontWeight: 700 }}>
            self {selfPct}%
          </span>
        </div>
      </div>
      {node.children?.map((child) => (
        <TimelineRow
          key={child.id}
          node={child}
          depth={depth + 1}
          theme={theme}
          l={l}
        />
      ))}
    </>
  );
}

// ─── FLAME GRAPH VIEW ───

function FlameBar({
  bar,
  theme,
  onHover,
  onLeave,
  isHovered,
}: {
  bar: FlatBar;
  theme: ReturnType<typeof useTheme>;
  onHover: (bar: FlatBar) => void;
  onLeave: () => void;
  isHovered: boolean;
}) {
  const catBg: Record<string, string> = {
    app: theme.appColorBg,
    library: theme.libraryColorBg,
    system: theme.systemColorBg,
    runtime: theme.runtimeColorBg,
  };

  const barHeight = 28;
  const showLabel = bar.width > 6;

  return (
    <div
      onMouseEnter={() => onHover(bar)}
      onMouseLeave={onLeave}
      style={{
        position: "absolute",
        left: `${bar.xStart}%`,
        top: bar.depth * (barHeight + 2),
        width: `${bar.width}%`,
        height: barHeight,
        background: bar.flattened ? theme.flattenText : catBg[bar.category],
        border: isHovered
          ? "2px solid #fff"
          : `1px solid rgba(255,255,255,0.15)`,
        borderRadius: 3,
        overflow: "hidden",
        cursor: "pointer",
        transition: "opacity 0.15s ease",
        opacity: bar.flattened ? 0.9 : 1,
        boxSizing: "border-box",
      }}
    >
      {showLabel && (
        <span
          style={{
            display: "block",
            padding: "0 4px",
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            color: "#fff",
            lineHeight: `${barHeight}px`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
          }}
        >
          {bar.name}
        </span>
      )}
    </div>
  );
}

function FlameGraph({
  tree,
  theme,
  l,
}: {
  tree: FlameNode;
  theme: ReturnType<typeof useTheme>;
  l: boolean;
}) {
  const [hoveredBar, setHoveredBar] = useState<FlatBar | null>(null);
  const bars = flattenToBarList(tree, 0, 0, TOTAL_SAMPLES);
  const maxDepth = Math.max(...bars.map((b) => b.depth)) + 1;
  const barHeight = 28;
  const totalHeight = maxDepth * (barHeight + 2) + 4;

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: totalHeight,
          background: theme.surface,
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${theme.border}`,
        }}
      >
        {bars.map((bar) => (
          <FlameBar
            key={bar.id}
            bar={bar}
            theme={theme}
            onHover={setHoveredBar}
            onLeave={() => setHoveredBar(null)}
            isHovered={hoveredBar?.id === bar.id}
          />
        ))}
      </div>

      {/* Tooltip */}
      <div
        style={{
          marginTop: 8,
          padding: "10px 14px",
          background: theme.tooltipBg,
          borderRadius: 8,
          minHeight: 50,
          transition: "all 0.2s ease",
        }}
      >
        {hoveredBar ? (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                color: theme.tooltipText,
                marginBottom: 4,
                wordBreak: "break-all",
              }}
            >
              {hoveredBar.name}
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 11,
                fontFamily: "'SF Mono', monospace",
              }}
            >
              <span style={{ color: theme.accentText }}>
                {l ? "Muestras" : "Samples"}:{" "}
                <strong>
                  {((hoveredBar.samples / TOTAL_SAMPLES) * 100).toFixed(1)}%
                </strong>{" "}
                ({hoveredBar.samples})
              </span>
              <span style={{ color: theme.textMuted }}>
                Self:{" "}
                <strong>
                  {((hoveredBar.selfSamples / TOTAL_SAMPLES) * 100).toFixed(1)}%
                </strong>
              </span>
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: theme.textFaint,
              fontStyle: "italic",
            }}
          >
            {l
              ? "Pasa el cursor sobre una barra para ver detalles"
              : "Hover over a bar to see details"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───

export default function FlameGraphVisualizer({
  lang = "es",
}: {
  lang?: Lang;
}) {
  const l = lang === "es";
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>("flamegraph");
  const [isFlattened, setIsFlattened] = useState(false);

  const tree = isFlattened ? flattenLibrary(buildTree()) : buildTree();

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
          <span style={{ fontSize: 14 }}>🔥</span>
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
          {l ? "Explorador de Flame Graph" : "Flame Graph Explorer"}
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
            ? "Visualiza los datos de profiling del Swift Evolution Metadata Extractor. Alterna entre vistas y aplica Flatten."
            : "Visualize profiling data from the Swift Evolution Metadata Extractor. Toggle between views and apply Flatten."}
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          justifyContent: "center",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* View toggle */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: theme.surface,
            borderRadius: 8,
            padding: 3,
            border: `1px solid ${theme.border}`,
          }}
        >
          {(["flamegraph", "timeline"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background:
                  viewMode === mode ? theme.btnActiveBg : "transparent",
                color:
                  viewMode === mode ? theme.btnActiveText : theme.btnText,
                fontSize: 11,
                fontWeight: viewMode === mode ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {mode === "flamegraph"
                ? "Flame Graph"
                : l
                  ? "Call Tree"
                  : "Call Tree"}
            </button>
          ))}
        </div>

        {/* Flatten toggle */}
        <button
          onClick={() => setIsFlattened(!isFlattened)}
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            border: `1px solid ${isFlattened ? theme.flattenBorder : theme.btnBorder}`,
            background: isFlattened ? theme.flattenBg : theme.btnBg,
            color: isFlattened ? theme.flattenText : theme.btnText,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
          }}
        >
          {isFlattened
            ? l
              ? "✓ Flatten aplicado"
              : "✓ Flatten applied"
            : l
              ? "Aplicar Flatten a swift-markdown"
              : "Apply Flatten to swift-markdown"}
        </button>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          {
            color: theme.appColor,
            label: l ? "Tu código" : "Your code",
          },
          {
            color: theme.libraryColor,
            label: l ? "Librería (swift-markdown)" : "Library (swift-markdown)",
          },
          {
            color: theme.systemColor,
            label: "System",
          },
          {
            color: theme.runtimeColor,
            label: "Swift Runtime",
          },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: theme.textMuted,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: item.color,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      {/* Visualization */}
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
          }}
        >
          {viewMode === "flamegraph" ? "Flame Graph" : "Call Tree"}{" "}
          {isFlattened && (
            <span style={{ color: theme.flattenText, fontSize: 9 }}>
              (swift-markdown flattened)
            </span>
          )}
        </div>

        {viewMode === "flamegraph" ? (
          <FlameGraph tree={tree} theme={theme} l={l} />
        ) : (
          <TimelineRow node={tree} depth={0} theme={theme} l={l} />
        )}
      </div>

      {/* Explanation */}
      <div
        style={{
          marginTop: 16,
          padding: "14px 18px",
          background: theme.surface,
          borderRadius: 10,
          border: `1px solid ${theme.border}`,
          fontSize: 13,
          lineHeight: 1.65,
          color: theme.textMuted,
        }}
      >
        {viewMode === "flamegraph" ? (
          l ? (
            <>
              <strong style={{ color: theme.accentText }}>
                Leyendo el Flame Graph:
              </strong>{" "}
              El ancho de cada barra representa el porcentaje de muestras — no
              el tiempo cronológico. Las barras más anchas son las funciones
              donde la CPU pasó más tiempo.{" "}
              {isFlattened
                ? "Al aplicar Flatten, las funciones internas de swift-markdown se colapsaron en una sola barra, dejando visible solo el punto de entrada. Tu código (azul) destaca más."
                : "Prueba aplicar Flatten para colapsar las funciones internas de swift-markdown y ver más claramente tu propio código."}
            </>
          ) : (
            <>
              <strong style={{ color: theme.accentText }}>
                Reading the Flame Graph:
              </strong>{" "}
              Each bar's width represents the percentage of samples — not
              chronological time. Wider bars are functions where the CPU spent
              more time.{" "}
              {isFlattened
                ? "With Flatten applied, swift-markdown's internal functions collapsed into a single bar, showing only the entry point. Your code (blue) stands out more."
                : "Try applying Flatten to collapse swift-markdown's internal functions and see your own code more clearly."}
            </>
          )
        ) : l ? (
          <>
            <strong style={{ color: theme.accentText }}>
              Vista Call Tree:
            </strong>{" "}
            La vista jerárquica tradicional. Cada nivel de indentación
            representa una llamada más profunda en el stack. Los porcentajes a
            la derecha muestran el peso total y el self-weight de cada función.
          </>
        ) : (
          <>
            <strong style={{ color: theme.accentText }}>
              Call Tree View:
            </strong>{" "}
            The traditional hierarchical view. Each indentation level represents
            a deeper call in the stack. Percentages on the right show each
            function's total weight and self-weight.
          </>
        )}
      </div>
    </div>
  );
}
