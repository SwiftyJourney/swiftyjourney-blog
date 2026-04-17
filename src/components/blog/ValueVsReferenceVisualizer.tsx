type Props = {
  lang?: "en" | "es";
};

export default function ValueVsReferenceVisualizer({ lang = "en" }: Props) {
  const copy = lang === "es" ? "Visualizador pendiente." : "Visualizer pending.";
  return (
    <div
      className="my-8 p-6 border border-dashed rounded-md text-sm"
      style={{
        borderColor: "var(--color-border-strong)",
        color: "var(--color-text-muted)",
        background: "var(--color-surface-alt)",
      }}
    >
      {copy}
    </div>
  );
}
