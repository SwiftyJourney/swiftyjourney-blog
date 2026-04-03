import { useState, useEffect, useCallback } from "react";

type Lang = "es" | "en";

interface HeapBlock {
  id: number;
  size: number;
  label: string;
  color: string;
  freed: boolean;
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
        bg: "#18181b",
        surface: "#27272a",
        border: "rgba(255,255,255,0.08)",
        text: "#e4e4e7",
        textMuted: "#a1a1aa",
        textFaint: "#71717a",
        freeBlock: "#27272a",
        freeBorder: "rgba(255,255,255,0.1)",
        badgeBg: "rgba(249,115,22,0.15)",
        badgeText: "#fb923c",
        accentText: "#f97316",
        btnBg: "#3f3f46",
        btnText: "#fff",
        btnDisabledBg: "#27272a",
        btnDisabledText: "#52525b",
        dangerBg: "rgba(239,68,68,0.15)",
        dangerText: "#f87171",
        logBg: "#1a1b26",
        fragWarning: "rgba(251,191,36,0.15)",
        fragWarningText: "#fbbf24",
      }
    : {
        bg: "#fff",
        surface: "#F8F8F5",
        border: "rgba(0,0,0,0.06)",
        text: "#333",
        textMuted: "#666",
        textFaint: "#999",
        freeBlock: "#f5f5f0",
        freeBorder: "rgba(0,0,0,0.08)",
        badgeBg: "rgba(234,88,12,0.1)",
        badgeText: "#ea580c",
        accentText: "#ea580c",
        btnBg: "#1a1a1a",
        btnText: "#fff",
        btnDisabledBg: "#e5e5e0",
        btnDisabledText: "#999",
        dangerBg: "rgba(220,38,38,0.08)",
        dangerText: "#dc2626",
        logBg: "#1a1b26",
        fragWarning: "rgba(217,119,6,0.1)",
        fragWarningText: "#d97706",
      };
}

const COLORS = ["#6366f1", "#06b6d4", "#22c55e", "#f97316", "#ec4899", "#8b5cf6", "#14b8a6"];
const TOTAL_CELLS = 32;

export default function HeapAllocatorVisualizer({ lang = "es" }: { lang?: Lang }) {
  const l = lang === "es";
  const theme = useTheme();
  const [blocks, setBlocks] = useState<HeapBlock[]>([]);
  const [nextId, setNextId] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [allocSize, setAllocSize] = useState(4);
  const [flash, setFlash] = useState<number | null>(null);

  const usedCells = blocks.filter((b) => !b.freed).reduce((s, b) => s + b.size, 0);
  const freeCells = TOTAL_CELLS - usedCells;
  const fragmentCount = (() => {
    const grid = buildGrid();
    let gaps = 0;
    let inGap = false;
    for (const cell of grid) {
      if (cell === null) {
        if (!inGap) { gaps++; inGap = true; }
      } else {
        inGap = false;
      }
    }
    return gaps;
  })();

  function buildGrid(): (number | null)[] {
    const grid: (number | null)[] = new Array(TOTAL_CELLS).fill(null);
    let pos = 0;
    for (const block of blocks) {
      if (!block.freed) {
        for (let i = 0; i < block.size && pos + i < TOTAL_CELLS; i++) {
          grid[pos + i] = block.id;
        }
      }
      pos += block.size;
    }
    return grid;
  }

  const handleMalloc = useCallback(() => {
    if (freeCells < allocSize) return;
    const id = nextId;
    const color = COLORS[(id - 1) % COLORS.length];
    const label = `ptr${id}`;
    setBlocks((prev) => [...prev, { id, size: allocSize, label, color, freed: false }]);
    setNextId((n) => n + 1);
    setLog((prev) => [...prev, `malloc(${allocSize * 8}) → ${label}  // ${l ? `reservó ${allocSize} celdas` : `reserved ${allocSize} cells`}`]);
    setFlash(id);
    setTimeout(() => setFlash(null), 600);
  }, [allocSize, freeCells, nextId, l]);

  const handleFree = useCallback((id: number) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, freed: true } : b)));
    const block = blocks.find((b) => b.id === id);
    if (block) {
      setLog((prev) => [...prev, `free(${block.label})  // ${l ? `liberó ${block.size} celdas` : `freed ${block.size} cells`}`]);
    }
  }, [blocks, l]);

  const handleReset = () => {
    setBlocks([]);
    setNextId(1);
    setLog([]);
    setFlash(null);
  };

  const grid = buildGrid();
  const activeBlocks = blocks.filter((b) => !b.freed);

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
            color: theme.text,
            letterSpacing: -0.3,
          }}
        >
          {l ? "malloc y free: el hotel de la memoria" : "malloc and free: the memory hotel"}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: theme.textMuted, lineHeight: 1.5 }}>
          {l
            ? "Reserva y libera bloques de memoria. Observa cómo se fragmenta el Heap."
            : "Allocate and free memory blocks. Watch how the Heap fragments."}
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>
            {l ? "Tamaño:" : "Size:"}
          </label>
          {[2, 4, 6, 8].map((s) => (
            <button
              key={s}
              onClick={() => setAllocSize(s)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: `1px solid ${s === allocSize ? theme.accentText : theme.border}`,
                background: s === allocSize ? theme.badgeBg : "transparent",
                color: s === allocSize ? theme.accentText : theme.textMuted,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}
            >
              {s * 8}B
            </button>
          ))}
        </div>

        <button
          onClick={handleMalloc}
          disabled={freeCells < allocSize}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: freeCells < allocSize ? theme.btnDisabledBg : theme.btnBg,
            color: freeCells < allocSize ? theme.btnDisabledText : theme.btnText,
            fontSize: 13,
            fontWeight: 700,
            cursor: freeCells < allocSize ? "default" : "pointer",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          malloc({allocSize * 8})
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: "transparent",
            color: theme.textMuted,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Reset
        </button>
      </div>

      {/* Heap Grid */}
      <div
        style={{
          background: theme.surface,
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.textFaint,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            Heap ({TOTAL_CELLS * 8} bytes)
          </span>
          <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
            {l ? `${freeCells * 8}B libres` : `${freeCells * 8}B free`} · {l ? `${usedCells * 8}B usados` : `${usedCells * 8}B used`}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${TOTAL_CELLS}, 1fr)`,
            gap: 2,
            marginBottom: 12,
          }}
        >
          {grid.map((blockId, i) => {
            const block = blockId !== null ? blocks.find((b) => b.id === blockId) : null;
            const isStart = i === 0 || grid[i - 1] !== blockId;
            const isEnd = i === TOTAL_CELLS - 1 || grid[i + 1] !== blockId;
            return (
              <div
                key={i}
                style={{
                  height: 32,
                  borderRadius: isStart && isEnd ? 4 : isStart ? "4px 0 0 4px" : isEnd ? "0 4px 4px 0" : 0,
                  background: block ? block.color : theme.freeBlock,
                  border: block ? "none" : `1px dashed ${theme.freeBorder}`,
                  opacity: flash === blockId ? 1 : block ? 0.85 : 0.5,
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isStart && block && block.size >= 3 && (
                  <span style={{ fontSize: 8, color: "#fff", fontWeight: 700, fontFamily: "'SF Mono', monospace" }}>
                    {block.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Fragmentation warning */}
        {fragmentCount > 2 && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: theme.fragWarning,
              fontSize: 12,
              color: theme.fragWarningText,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {l
              ? `⚠️ Fragmentación detectada: ${fragmentCount} huecos libres no contiguos`
              : `⚠️ Fragmentation detected: ${fragmentCount} non-contiguous free gaps`}
          </div>
        )}
      </div>

      {/* Active blocks with free buttons */}
      {activeBlocks.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 16,
            justifyContent: "center",
          }}
        >
          {activeBlocks.map((block) => (
            <button
              key={block.id}
              onClick={() => handleFree(block.id)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px solid ${theme.border}`,
                background: theme.dangerBg,
                color: theme.dangerText,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: block.color,
                  display: "inline-block",
                }}
              />
              free({block.label})
            </button>
          ))}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div
          style={{
            background: theme.logBg,
            borderRadius: 10,
            padding: "10px 14px",
            maxHeight: 150,
            overflowY: "auto",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {l ? "Registro" : "Log"}
          </div>
          {log.map((entry, i) => (
            <div
              key={i}
              style={{
                fontSize: 11,
                color: entry.startsWith("free") ? "#f87171" : "#a5f3fc",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                lineHeight: 1.8,
              }}
            >
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
