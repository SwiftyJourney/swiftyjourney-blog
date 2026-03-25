import { useState, useEffect, type ReactNode } from "react";
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
type ColorKey = keyof typeof colorMap;

const colorMap = {
  teal: { bg: "#E1F5EE", border: "#0F6E56", text: "#085041", light: "#9FE1CB", accent: "#1D9E75", dark: "#04342C" },
  blue: { bg: "#E6F1FB", border: "#185FA5", text: "#0C447C", light: "#85B7EB", accent: "#378ADD", dark: "#042C53" },
  purple: { bg: "#EEEDFE", border: "#534AB7", text: "#3C3489", light: "#AFA9EC", accent: "#7F77DD", dark: "#26215C" },
  coral: { bg: "#FAECE7", border: "#993C1D", text: "#712B13", light: "#F0997B", accent: "#D85A30", dark: "#4A1B0C" },
  amber: { bg: "#FAEEDA", border: "#854F0B", text: "#633806", light: "#FAC775", accent: "#EF9F27", dark: "#412402" },
  green: { bg: "#EAF3DE", border: "#3B6D11", text: "#27500A", light: "#C0DD97", accent: "#639922", dark: "#173404" },
  red: { bg: "#FCEBEB", border: "#A32D2D", text: "#791F1F", light: "#F09595", accent: "#E24B4A", dark: "#501313" },
  gray: { bg: "#F1EFE8", border: "#5F5E5A", text: "#444441", light: "#D3D1C7", accent: "#888780", dark: "#2C2C2A" },
} as const;

// ─── THEME ───

function useTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark
    ? { bg: "#18181b", surface: "#27272a", surfaceAlt: "#1f1f23", border: "rgba(255,255,255,0.08)", text: "#e4e4e7", textMuted: "#a1a1aa", textFaint: "#71717a", codeBg: "#0d1117", codeText: "#c0caf5", navBg: "#27272a", navActiveBg: "#3f3f46", navActiveText: "#fff", buttonBg: "#e4e4e7", buttonText: "#18181b", headingText: "#f4f4f5", headerGradientEnd: "#18181b" }
    : { bg: "#fff", surface: "#F8F8F5", surfaceAlt: "#F0F0EC", border: "rgba(0,0,0,0.06)", text: "#444", textMuted: "#777", textFaint: "#999", codeBg: "#1a1b26", codeText: "#c0caf5", navBg: "#F5F5F0", navActiveBg: "#fff", navActiveText: undefined as string | undefined, buttonBg: "#1a1a1a", buttonText: "#fff", headingText: "#1a1a1a", headerGradientEnd: "white" };
}

// ─── JULIO LINK HELPER ───

const julioLink = <a href="https://www.linkedin.com/in/jcfmunoz" style={{ color: "#185FA5", textDecoration: "none", borderBottom: "1px solid #85B7EB" }} target="_blank" rel="noopener noreferrer">Julio César Fernández</a>;
const academyLink = <a href="https://acoding.academy" style={{ color: "#185FA5", textDecoration: "none", borderBottom: "1px solid #85B7EB" }} target="_blank" rel="noopener noreferrer">Apple Coding Academy</a>;

// ─── SUB-COMPONENTS ───

function Code({ children }: { children: ReactNode }) {
  return (
    <code style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: 12, background: "rgba(0,0,0,0.06)", padding: "2px 7px", borderRadius: 5, color: "#c7254e", whiteSpace: "nowrap" }}>
      {children}
    </code>
  );
}

function CodeBlock({ code, title, highlight }: { code: string; title?: string; highlight?: "good" | "bad" }) {
  const html = highlighter.codeToHtml(code, {
    lang: "swift",
    theme: "one-dark-pro",
    transformers: [{
      pre(node) {
        node.properties.style = `${node.properties.style ?? ""};margin:0;padding:14px 16px;overflow-x:auto;font-size:12.5px;line-height:1.65;font-family:'SF Mono','Fira Code',monospace;border-radius:0;`;
      },
    }],
  });
  return (
    <div style={{ margin: "16px 0", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
      {title && (
        <div style={{ padding: "8px 14px", background: highlight === "good" ? "#E1F5EE" : highlight === "bad" ? "#FCEBEB" : "rgba(0,0,0,0.05)", fontSize: 12, fontWeight: 700, fontFamily: "'SF Mono', monospace", color: highlight === "good" ? "#085041" : highlight === "bad" ? "#791F1F" : "#555", letterSpacing: 0.3 }}>
          {title}
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function Badge({ children, color = "blue", size = "sm" }: { children: ReactNode; color?: ColorKey; size?: "sm" | "lg" }) {
  const c = colorMap[color];
  return (
    <span style={{ display: "inline-block", padding: size === "sm" ? "3px 10px" : "5px 14px", borderRadius: 6, background: c.bg, color: c.text, fontSize: size === "sm" ? 11 : 12, fontWeight: 600, border: `1px solid ${c.light}` }}>
      {children}
    </span>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "warning" | "danger" | "success" | "expert"; children: ReactNode }) {
  const s = { info: { bg: "#E6F1FB", border: "#85B7EB", icon: "💡", color: "#0C447C" }, warning: { bg: "#FAEEDA", border: "#FAC775", icon: "⚠️", color: "#633806" }, danger: { bg: "#FCEBEB", border: "#F09595", icon: "🚨", color: "#791F1F" }, success: { bg: "#EAF3DE", border: "#C0DD97", icon: "✅", color: "#27500A" }, expert: { bg: "#EEEDFE", border: "#AFA9EC", icon: "🎓", color: "#3C3489" } }[type];
  return (
    <div style={{ padding: "14px 16px", borderRadius: 12, background: s.bg, borderLeft: `4px solid ${s.border}`, margin: "16px 0", color: s.color, fontSize: 13.5, lineHeight: 1.65 }}>
      <span style={{ marginRight: 8 }}>{s.icon}</span>{children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div style={{ overflowX: "auto", margin: "16px 0", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>{headers.map((h, i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", background: "rgba(0,0,0,0.04)", borderBottom: "2px solid rgba(0,0,0,0.08)", fontWeight: 700, whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)" }}>{row.map((cell, j) => <td key={j} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(0,0,0,0.04)", verticalAlign: "top" }}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  const theme = useTheme();
  return (
    <div style={{ margin: "28px 0 14px" }}>
      <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: theme.headingText, lineHeight: 1.3 }}>{children}</h3>
      {sub && <p style={{ fontSize: 13, color: theme.textMuted, margin: "4px 0 0", fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ─── SECTIONS ───

function OverviewSection({ lang }: { lang: Lang }) {
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: theme.text }}>
        <strong style={{ color: theme.headingText }}>Approachable Concurrency</strong>{" "}
        {l
          ? <>es un build setting real en Xcode 26 que activa un conjunto de compiler flags para hacer la concurrencia más accesible. Nace del{" "}<a href="https://github.com/swiftlang/swift-evolution/blob/main/visions/approachable-concurrency.md" style={{ color: "#185FA5", textDecoration: "none", borderBottom: "1px solid #85B7EB" }}>vision document</a>{" "}del Swift team publicado en febrero 2025.</>
          : <>is a real build setting in Xcode 26 that enables a set of compiler flags to make concurrency more accessible. It comes from the{" "}<a href="https://github.com/swiftlang/swift-evolution/blob/main/visions/approachable-concurrency.md" style={{ color: "#185FA5", textDecoration: "none", borderBottom: "1px solid #85B7EB" }}>vision document</a>{" "}published by the Swift team in February 2025.</>}
      </p>
      <Callout type="info">
        <strong>{l ? "Es un setting real, no solo un concepto." : "It's a real setting, not just a concept."}</strong>{" "}
        {l
          ? "Approachable Concurrency es completamente independiente de Default Actor Isolation. Son dos knobs separados en Xcode."
          : "Approachable Concurrency is completely independent from Default Actor Isolation. They are two separate knobs in Xcode."}
      </Callout>
      <SectionTitle sub={l ? "Lo que se activa al poner Approachable Concurrency = Yes" : "What gets enabled when setting Approachable Concurrency = Yes"}>
        {l ? "Las 5 feature flags" : "The 5 feature flags"}
      </SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { flag: "NonisolatedNonsendingByDefault", se: "SE-0461", desc: l ? "Async nonisolated hereda el actor del caller" : "Async nonisolated inherits the caller's actor", tag: l ? "Nuevo en 6.2" : "New in 6.2", color: "blue" as ColorKey, key: true },
          { flag: "InferIsolatedConformances", se: "SE-0470", desc: l ? "Conformances aisladas por actor" : "Actor-isolated conformances", tag: l ? "Nuevo en 6.2" : "New in 6.2", color: "blue" as ColorKey, key: true },
          { flag: "InferSendableFromCaptures", se: "SE-0418", desc: l ? "Inferencia automática de @Sendable" : "Automatic @Sendable inference", tag: l ? "Ya en Swift 6" : "Already in Swift 6", color: "green" as ColorKey },
          { flag: "GlobalActorIsolatedTypesUsability", se: "SE-0434", desc: l ? "Mejor usabilidad de tipos @MainActor" : "Better usability for @MainActor types", tag: l ? "Ya en Swift 6" : "Already in Swift 6", color: "green" as ColorKey },
          { flag: "DisableOutwardActorInference", se: "SE-0401", desc: l ? "Property wrappers no propagan aislamiento" : "Property wrappers don't propagate isolation", tag: l ? "Ya en Swift 6" : "Already in Swift 6", color: "green" as ColorKey },
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: f.key ? colorMap.blue.bg : theme.surface, border: `1px solid ${f.key ? colorMap.blue.light : theme.border}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, fontFamily: "monospace", color: f.key ? colorMap.blue.text : theme.headingText, overflow: "hidden", textOverflow: "ellipsis" }}>{f.flag}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{f.se} · {f.desc}</div>
            </div>
            <Badge color={f.color}>{f.tag}</Badge>
          </div>
        ))}
      </div>
      <Callout type="warning">
        <strong>{l ? "En Swift 6 language mode" : "In Swift 6 language mode"}</strong>{l
          ? <>, solo 2 flags cambian: <Code>InferIsolatedConformances</Code> y <Code>NonisolatedNonsendingByDefault</Code>. Las otras 3 ya están habilitadas por defecto.</>
          : <>, only 2 flags change: <Code>InferIsolatedConformances</Code> and <Code>NonisolatedNonsendingByDefault</Code>. The other 3 are already enabled by default.</>}
      </Callout>
      <SectionTitle>{l ? "Cómo activarlo en un Swift Package" : "How to enable it in a Swift Package"}</SectionTitle>
      <CodeBlock title="Package.swift" code={l
        ? `// swift-tools-version: 6.2

.target(
    name: "YourTarget",
    swiftSettings: [
        // Solo si quieres MainActor default (opcional):
        // .defaultIsolation(MainActor.self),

        // Approachable Concurrency flags:
        .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
        .enableUpcomingFeature("InferIsolatedConformances"),
        .enableUpcomingFeature("InferSendableFromCaptures"),
        .enableUpcomingFeature("GlobalActorIsolatedTypesUsability"),
        .enableUpcomingFeature("DisableOutwardActorInference")
    ]
)`
        : `// swift-tools-version: 6.2

.target(
    name: "YourTarget",
    swiftSettings: [
        // Only if you want MainActor default (optional):
        // .defaultIsolation(MainActor.self),

        // Approachable Concurrency flags:
        .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
        .enableUpcomingFeature("InferIsolatedConformances"),
        .enableUpcomingFeature("InferSendableFromCaptures"),
        .enableUpcomingFeature("GlobalActorIsolatedTypesUsability"),
        .enableUpcomingFeature("DisableOutwardActorInference")
    ]
)`} />
    </div>
  );
}

function RecommendedConfigSection({ lang }: { lang: Lang }) {
  const [tab, setTab] = useState("recommended");
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: theme.text }}>
        {l
          ? <>Esta es la configuración que utilizo y que es recomendada por {julioLink}, Co-fundador, CTO y Director Académico de {academyLink}. Refleja un entendimiento profundo del modelo de concurrencia. Veamos exactamente qué significa y por qué es una decisión de experto.</>
          : <>This is the configuration I use, recommended by {julioLink}, Co-founder, CTO and Academic Director at {academyLink}. It reflects a deep understanding of the concurrency model. Let's look at exactly what it means and why it's an expert-level decision.</>}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "20px 0" }}>
        {[
          { label: "Swift Language", value: "6 — Complete", color: "teal" as ColorKey },
          { label: "Default Isolation", value: "nonisolated", color: "amber" as ColorKey },
          { label: "Approachable Concurrency", value: "Yes", color: "blue" as ColorKey },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px", borderRadius: 12, background: colorMap[s.color].bg, border: `1px solid ${colorMap[s.color].light}`, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: colorMap[s.color].border, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: colorMap[s.color].text }}>{s.value}</div>
          </div>
        ))}
      </div>
      <Callout type="expert">
        <strong>{l ? "¿Por qué esta combinación es inteligente?" : "Why is this combination smart?"}</strong>{" "}
        {l
          ? <>Obtiene los beneficios de <Code>nonsending</Code> (funciones async ya no se escapan al global executor) sin que todo se vuelva <Code>@MainActor</Code> automáticamente. Tiene control granular y explícito sobre el aislamiento.</>
          : <>You get the benefits of <Code>nonsending</Code> (async functions no longer escape to the global executor) without everything becoming <Code>@MainActor</Code> automatically. You have granular, explicit control over isolation.</>}
      </Callout>
      <SectionTitle>{l ? "Comparación lado a lado" : "Side by side comparison"}</SectionTitle>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { id: "recommended", label: l ? "Config Recomendada" : "Recommended Config", icon: "🎓" },
          { id: "xcode26", label: "Default Xcode 26", icon: "🆕" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", background: tab === t.id ? theme.buttonBg : theme.surfaceAlt, color: tab === t.id ? theme.buttonText : theme.textMuted, fontWeight: 700, fontSize: 13, transition: "all 0.2s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === "recommended" ? (
        <div>
          <CodeBlock title={l ? "✅ Config Recomendada — nonisolated + Approachable Yes" : "✅ Recommended Config — nonisolated + Approachable Yes"} highlight="good" code={l
            ? `// Default Isolation: nonisolated
// Approachable Concurrency: Yes
// → nonisolated(nonsending) es el default para async

// --- Capa de Networking (NO es @MainActor) ---
class NetworkService {
    // nonisolated(nonsending) por defecto
    // → hereda el actor de quien lo llame
    func fetchUser(id: Int) async throws -> User {
        let (data, _) = try await URLSession
            .shared.data(from: makeURL(id))
        return try JSONDecoder()
            .decode(User.self, from: data)
    }

    // Trabajo CPU pesado → background explícito
    @concurrent
    func decodeHugePayload(_ data: Data) async -> [Item] {
        // Corre en global executor (background)
        return try! JSONDecoder()
            .decode([Item].self, from: data)
    }
}

// --- Capa de UI (SÍ es @MainActor — explícito) ---
@MainActor  // 👈 Placed where needed (explicit)
class UserViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    private let service = NetworkService()

    func loadUser() async {
        isLoading = true
        // fetchUser() hereda MainActor (nonsending)
        // → no hay cruce de boundaries ✅
        // → no necesita Sendable ✅
        user = try? await service.fetchUser(id: 1)
        isLoading = false
    }
}

// --- Capa de datos (NO es @MainActor) ---
class CacheManager {
    // nonisolated por defecto
    // Si lo llamas desde MainActor → corre en MainActor
    // Si lo llamas desde un actor custom → corre ahí
    func store(_ user: User) async {
        // Hereda contexto del caller
    }
}`
            : `// Default Isolation: nonisolated
// Approachable Concurrency: Yes
// → nonisolated(nonsending) is the default for async

// --- Networking Layer (NOT @MainActor) ---
class NetworkService {
    // nonisolated(nonsending) by default
    // → inherits the actor from the caller
    func fetchUser(id: Int) async throws -> User {
        let (data, _) = try await URLSession
            .shared.data(from: makeURL(id))
        return try JSONDecoder()
            .decode(User.self, from: data)
    }

    // CPU-heavy work → explicit background
    @concurrent
    func decodeHugePayload(_ data: Data) async -> [Item] {
        // Runs on global executor (background)
        return try! JSONDecoder()
            .decode([Item].self, from: data)
    }
}

// --- UI Layer (IS @MainActor — explicit) ---
@MainActor  // 👈 Placed where needed (explicit)
class UserViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    private let service = NetworkService()

    func loadUser() async {
        isLoading = true
        // fetchUser() inherits MainActor (nonsending)
        // → no boundary crossing ✅
        // → no Sendable needed ✅
        user = try? await service.fetchUser(id: 1)
        isLoading = false
    }
}

// --- Data Layer (NOT @MainActor) ---
class CacheManager {
    // nonisolated by default
    // If called from MainActor → runs on MainActor
    // If called from a custom actor → runs there
    func store(_ user: User) async {
        // Inherits caller's context
    }
}`} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "16px 0" }}>
            {[
              { icon: "✅", title: l ? "Ventajas" : "Advantages", items: l
                ? ["Control total: sabes exactamente qué está en MainActor", "Ideal para packages/libraries que no deben asumir MainActor", "nonsending elimina errores de Sendable innecesarios", "Consistente entre app targets y SPM packages"]
                : ["Full control: you know exactly what's on MainActor", "Ideal for packages/libraries that shouldn't assume MainActor", "nonsending eliminates unnecessary Sendable errors", "Consistent between app targets and SPM packages"], color: "green" as ColorKey },
              { icon: "⚡", title: l ? "Requiere" : "Requires", items: l
                ? ["Entender el modelo de aislamiento", "Anotar @MainActor manualmente en ViewModels/UI", "Saber cuándo usar @concurrent vs dejar el default", "Más anotaciones que MainActor default"]
                : ["Understanding the isolation model", "Manually annotating @MainActor on ViewModels/UI", "Knowing when to use @concurrent vs leaving the default", "More annotations than MainActor default"], color: "amber" as ColorKey },
            ].map((col, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: colorMap[col.color].bg, border: `1px solid ${colorMap[col.color].light}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colorMap[col.color].text, marginBottom: 8 }}>{col.icon} {col.title}</div>
                {col.items.map((item, j) => <div key={j} style={{ fontSize: 12, color: colorMap[col.color].border, marginBottom: 4, lineHeight: 1.5 }}>→ {item}</div>)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <CodeBlock title="🆕 Default Xcode 26 — MainActor + Approachable Yes" code={l
            ? `// Default Isolation: MainActor
// Approachable Concurrency: Yes
// → TODO es @MainActor automáticamente

// --- Capa de Networking ---
class NetworkService {
    // ⚠️ Es @MainActor implícitamente
    // fetchUser corre en MainActor por defecto
    func fetchUser(id: Int) async throws -> User {
        let (data, _) = try await URLSession
            .shared.data(from: makeURL(id))
        return try JSONDecoder()
            .decode(User.self, from: data)
    }

    // Para background: @concurrent (opt-out explícito)
    @concurrent
    func decodeHugePayload(_ data: Data) async -> [Item] {
        return try! JSONDecoder()
            .decode([Item].self, from: data)
    }
}

// --- Capa de UI ---
// No necesitas @MainActor — ya es implícito
class UserViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    private let service = NetworkService()

    func loadUser() async {
        isLoading = true
        // Todo corre en MainActor automáticamente ✅
        user = try? await service.fetchUser(id: 1)
        isLoading = false
    }
}

// --- Capa de datos ---
// ⚠️ También es @MainActor por defecto
// Si NO quieres MainActor, debes marcar nonisolated
nonisolated class CacheManager {
    // Ahora sí es nonisolated
    func store(_ user: User) async {
        // Hereda contexto del caller (nonsending)
    }
}`
            : `// Default Isolation: MainActor
// Approachable Concurrency: Yes
// → EVERYTHING is @MainActor automatically

// --- Networking Layer ---
class NetworkService {
    // ⚠️ Implicitly @MainActor
    // fetchUser runs on MainActor by default
    func fetchUser(id: Int) async throws -> User {
        let (data, _) = try await URLSession
            .shared.data(from: makeURL(id))
        return try JSONDecoder()
            .decode(User.self, from: data)
    }

    // For background: @concurrent (explicit opt-out)
    @concurrent
    func decodeHugePayload(_ data: Data) async -> [Item] {
        return try! JSONDecoder()
            .decode([Item].self, from: data)
    }
}

// --- UI Layer ---
// You don't need @MainActor — it's already implicit
class UserViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    private let service = NetworkService()

    func loadUser() async {
        isLoading = true
        // Everything runs on MainActor automatically ✅
        user = try? await service.fetchUser(id: 1)
        isLoading = false
    }
}

// --- Data Layer ---
// ⚠️ Also @MainActor by default
// If you DON'T want MainActor, you must mark nonisolated
nonisolated class CacheManager {
    // Now it IS nonisolated
    func store(_ user: User) async {
        // Inherits caller's context (nonsending)
    }
}`} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "16px 0" }}>
            {[
              { icon: "✅", title: l ? "Ventajas" : "Advantages", items: l
                ? ["Menos anotaciones — casi cero @MainActor", "Ideal para principiantes y apps UI-centric", "Elimina falsos positivos de concurrencia", "Es el default de Apple para proyectos nuevos"]
                : ["Fewer annotations — almost zero @MainActor", "Ideal for beginners and UI-centric apps", "Eliminates false positive concurrency errors", "Apple's default for new projects"], color: "green" as ColorKey },
              { icon: "⚡", title: l ? "Cuidado con" : "Watch out for", items: l
                ? ["Packages/libraries NO deberían usar MainActor default", "Debes marcar nonisolated lo que NO sea UI", "Puedes bloquear MainActor si no usas @concurrent", "Modelo mental invertido vs Swift 6.1"]
                : ["Packages/libraries should NOT use MainActor default", "You must mark nonisolated anything that's NOT UI", "You can block MainActor if you don't use @concurrent", "Inverted mental model vs Swift 6.1"], color: "amber" as ColorKey },
            ].map((col, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: colorMap[col.color].bg, border: `1px solid ${colorMap[col.color].light}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colorMap[col.color].text, marginBottom: 8 }}>{col.icon} {col.title}</div>
                {col.items.map((item, j) => <div key={j} style={{ fontSize: 12, color: colorMap[col.color].border, marginBottom: 4, lineHeight: 1.5 }}>→ {item}</div>)}
              </div>
            ))}
          </div>
        </div>
      )}
      <SectionTitle>{l ? "¿Cuál es para ti?" : "Which one is for you?"}</SectionTitle>
      <Table
        headers={["", l ? "Config Recomendada" : "Recommended Config", "Default Xcode 26"]}
        rows={l
          ? [["Perfil ideal", "Experto que quiere control", "Principiante o app UI-heavy"], ["Default isolation", "nonisolated", "MainActor"], ["SPM Packages", "✅ Funciona perfecto", "⚠️ No recomendado"], ["App targets", "✅ Con anotación explícita", "✅ Zero config"], ["Visibilidad", "Total — ves cada @MainActor", "Implícita — marcas excepciones"], ["Anotaciones", "Más @MainActor manuales", "Más nonisolated manuales"], ["Modelo mental", "Opt-in a MainActor", "Opt-out de MainActor"]]
          : [["Ideal profile", "Expert who wants control", "Beginner or UI-heavy app"], ["Default isolation", "nonisolated", "MainActor"], ["SPM Packages", "✅ Works perfectly", "⚠️ Not recommended"], ["App targets", "✅ With explicit annotation", "✅ Zero config"], ["Visibility", "Full — you see every @MainActor", "Implicit — you mark exceptions"], ["Annotations", "More manual @MainActor", "More manual nonisolated"], ["Mental model", "Opt-in to MainActor", "Opt-out of MainActor"]]}
      />
      <Callout type="success">
        <strong>{l ? "Donny Wals confirma:" : "Donny Wals confirms:"}</strong>{" "}
        {l
          ? <>Para app targets, MainActor default tiene sentido. Pero para SPM Packages (como Networking), probablemente no quieras MainActor default. Esta configuración, recomendada por {julioLink} de {academyLink}, funciona bien para ambos escenarios porque mantiene consistencia entre targets.</>
          : <>For app targets, MainActor default makes sense. But for SPM Packages (like Networking), you probably don't want MainActor default. This configuration, recommended by {julioLink} from {academyLink}, works well for both scenarios because it maintains consistency between targets.</>}
      </Callout>
    </div>
  );
}

function NonsendingSection({ lang }: { lang: Lang }) {
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: theme.text }}>
        <Code>NonisolatedNonsendingByDefault</Code>{" "}
        {l
          ? <>{" "}es <strong style={{ color: theme.headingText }}>la feature más importante</strong> de Approachable Concurrency. Cambia fundamentalmente dónde corren las funciones <Code>async</Code> que no están aisladas a ningún actor.</>
          : <>{" "}is <strong style={{ color: theme.headingText }}>the most important feature</strong> of Approachable Concurrency. It fundamentally changes where <Code>async</Code> functions run when they aren't isolated to any actor.</>}
      </p>
      <SectionTitle sub={l ? "Swift 6.1 y anteriores" : "Swift 6.1 and earlier"}>
        {l ? "El problema: comportamiento inconsistente" : "The problem: inconsistent behavior"}
      </SectionTitle>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: theme.textMuted }}>
        {l
          ? <>Una función <Code>nonisolated</Code> síncrona corre en el contexto del caller (intuitivo). Pero una <Code>nonisolated async</Code> se escapa al global executor (un hilo background). Esto genera errores de <Code>Sendable</Code> innecesarios y confusión.</>
          : <>A synchronous <Code>nonisolated</Code> function runs in the caller's context (intuitive). But a <Code>nonisolated async</Code> escapes to the global executor (a background thread). This generates unnecessary <Code>Sendable</Code> errors and confusion.</>}
      </p>
      <CodeBlock title={l ? "❌ Swift 6.1 — nonisolated async se escapa" : "❌ Swift 6.1 — nonisolated async escapes"} highlight="bad" code={l
        ? `@MainActor
class ViewModel {
    var photos: [Photo] = []

    func loadPhotos() async {
        // ⚠️ fetchPhotos() se va al global executor
        // automáticamente — NO lo pedimos
        let result = try await fetchPhotos()
        photos = result // ❌ Sendable error!
    }
}

// nonisolated async → global executor (background thread)
func fetchPhotos() async throws -> [Photo] {
    // Corre en background AUNQUE NO LO PEDIMOS
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([Photo].self, from: data)
}`
        : `@MainActor
class ViewModel {
    var photos: [Photo] = []

    func loadPhotos() async {
        // ⚠️ fetchPhotos() goes to the global executor
        // automatically — we didn't ask for it
        let result = try await fetchPhotos()
        photos = result // ❌ Sendable error!
    }
}

// nonisolated async → global executor (background thread)
func fetchPhotos() async throws -> [Photo] {
    // Runs on background EVEN THOUGH WE DIDN'T ASK
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([Photo].self, from: data)
}`} />
      <SectionTitle sub={l ? "Swift 6.2 con NonisolatedNonsendingByDefault" : "Swift 6.2 with NonisolatedNonsendingByDefault"}>
        {l ? "La solución: hereda el actor del caller" : "The solution: inherits the caller's actor"}
      </SectionTitle>
      <CodeBlock title={l ? "✅ Swift 6.2 — Consistente y predecible" : "✅ Swift 6.2 — Consistent and predictable"} highlight="good" code={l
        ? `@MainActor
class ViewModel {
    var photos: [Photo] = []

    func loadPhotos() async {
        // fetchPhotos() ahora corre en MainActor
        // porque HEREDA el actor del caller
        let result = try await fetchPhotos()
        photos = result // ✅ Sin error, mismo contexto
    }
}

// nonisolated(nonsending) es ahora el DEFAULT
// No necesitas escribirlo — es implícito
func fetchPhotos() async throws -> [Photo] {
    // Corre en el actor de quien lo llamó
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([Photo].self, from: data)
}`
        : `@MainActor
class ViewModel {
    var photos: [Photo] = []

    func loadPhotos() async {
        // fetchPhotos() now runs on MainActor
        // because it INHERITS the caller's actor
        let result = try await fetchPhotos()
        photos = result // ✅ No error, same context
    }
}

// nonisolated(nonsending) is now the DEFAULT
// You don't need to write it — it's implicit
func fetchPhotos() async throws -> [Photo] {
    // Runs on the caller's actor
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([Photo].self, from: data)
}`} />
      <SectionTitle sub={l ? "Cuando SÍ necesitas background" : "When you DO need background"}>
        <Code>@concurrent</Code> — {l ? "el opt-out explícito" : "the explicit opt-out"}
      </SectionTitle>
      <CodeBlock title={l ? "@concurrent — Background thread explícito" : "@concurrent — Explicit background thread"} code={l
        ? `class ImageProcessor {
    // ✅ Default: hereda actor del caller
    func loadImage(from url: URL) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }

    // ✅ Explícitamente en background
    @concurrent
    func applyFilters(_ data: Data) async -> UIImage {
        // CPU-intensivo → global executor (background)
        let ciImage = CIImage(data: data)!
        let filter = CIFilter(name: "CIGaussianBlur")!
        filter.setValue(ciImage, forKey: kCIInputImageKey)
        filter.setValue(10.0, forKey: kCIInputRadiusKey)
        return UIImage(ciImage: filter.outputImage!)
    }
}

// Uso:
@MainActor
class PhotoViewModel {
    let processor = ImageProcessor()

    func process() async {
        // loadImage hereda MainActor (nonsending) ✅
        let data = try await processor.loadImage(from: url)

        // applyFilters va a background (@concurrent) ✅
        let image = await processor.applyFilters(data)

        // De vuelta en MainActor automáticamente ✅
        self.displayImage = image
    }
}`
        : `class ImageProcessor {
    // ✅ Default: inherits caller's actor
    func loadImage(from url: URL) async throws -> Data {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }

    // ✅ Explicitly on background
    @concurrent
    func applyFilters(_ data: Data) async -> UIImage {
        // CPU-intensive → global executor (background)
        let ciImage = CIImage(data: data)!
        let filter = CIFilter(name: "CIGaussianBlur")!
        filter.setValue(ciImage, forKey: kCIInputImageKey)
        filter.setValue(10.0, forKey: kCIInputRadiusKey)
        return UIImage(ciImage: filter.outputImage!)
    }
}

// Usage:
@MainActor
class PhotoViewModel {
    let processor = ImageProcessor()

    func process() async {
        // loadImage inherits MainActor (nonsending) ✅
        let data = try await processor.loadImage(from: url)

        // applyFilters goes to background (@concurrent) ✅
        let image = await processor.applyFilters(data)

        // Back on MainActor automatically ✅
        self.displayImage = image
    }
}`} />
      <Callout type="danger">
        <strong>{l ? "Migración:" : "Migration:"}</strong>{" "}
        {l
          ? <>Si activas esta flag sin migrar, métodos que antes iban a background ahora correrán en MainActor. Añade <Code>@concurrent</Code> donde necesites background ANTES de activar la flag.</>
          : <>If you enable this flag without migrating, methods that previously ran on background will now run on MainActor. Add <Code>@concurrent</Code> where you need background BEFORE enabling the flag.</>}
      </Callout>
      <Table
        headers={[l ? "Escenario" : "Scenario", "Swift 6.1", "Swift 6.2 + nonsending"]}
        rows={[
          [<span>nonisolated <strong>sync</strong></span>, l ? "Corre en el caller ✅" : "Runs on caller ✅", l ? "Corre en el caller ✅" : "Runs on caller ✅"],
          [<span>nonisolated <strong>async</strong></span>, "Global executor 🔀", l ? "Corre en el caller ✅" : "Runs on caller ✅"],
          [l ? "Trabajo CPU pesado" : "CPU-heavy work", l ? "Se iba solo al background" : "Went to background on its own", <span>{l ? "Usa" : "Use"} <Code>@concurrent</Code></span>],
          [l ? "Sendable requerido?" : "Sendable required?", l ? "Sí, frecuentemente 😫" : "Yes, frequently 😫", l ? "Mucho menos 🎉" : "Much less 🎉"],
          [l ? "Consistencia sync/async" : "sync/async consistency", l ? "❌ Inconsistente" : "❌ Inconsistent", l ? "✅ Unificado" : "✅ Unified"],
        ]}
      />
    </div>
  );
}

function ConformancesSection({ lang }: { lang: Lang }) {
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: theme.text }}>
        <Code>InferIsolatedConformances</Code>{" "}
        {l
          ? <>permite que tipos <Code>@MainActor</Code> conformen protocolos de forma <strong style={{ color: theme.headingText }}>limitada a su contexto de aislamiento</strong>. Es nueva en Swift 6.2.</>
          : <>allows <Code>@MainActor</Code> types to conform to protocols <strong style={{ color: theme.headingText }}>limited to their isolation context</strong>. New in Swift 6.2.</>}
      </p>
      <SectionTitle>{l ? "El problema: workarounds peligrosos" : "The problem: dangerous workarounds"}</SectionTitle>
      <CodeBlock title={l ? "❌ Swift 6.1 — Workaround con nonisolated" : "❌ Swift 6.1 — Workaround with nonisolated"} highlight="bad" code={l
        ? `@MainActor
class UserProfile: Equatable {
    var name: String = ""
    var age: Int = 0

    // Necesitabas marcar como nonisolated para compilar
    // Pero accedes a estado aislado desde contexto no aislado
    nonisolated static func == (
        lhs: UserProfile, rhs: UserProfile
    ) -> Bool {
        // ⚠️ Potencial data race!
        lhs.name == rhs.name && lhs.age == rhs.age
    }
}`
        : `@MainActor
class UserProfile: Equatable {
    var name: String = ""
    var age: Int = 0

    // You had to mark as nonisolated to compile
    // But you access isolated state from non-isolated context
    nonisolated static func == (
        lhs: UserProfile, rhs: UserProfile
    ) -> Bool {
        // ⚠️ Potential data race!
        lhs.name == rhs.name && lhs.age == rhs.age
    }
}`} />
      <SectionTitle>{l ? "La solución: conformance aislada" : "The solution: isolated conformance"}</SectionTitle>
      <CodeBlock title={l ? "✅ Swift 6.2 — Conformance segura" : "✅ Swift 6.2 — Safe conformance"} highlight="good" code={l
        ? `@MainActor
class UserProfile: Equatable {
    var name: String = ""
    var age: Int = 0

    // La conformance es implícitamente aislada al MainActor
    // Solo funciona cuando se llama desde MainActor
    static func == (
        lhs: UserProfile, rhs: UserProfile
    ) -> Bool {
        // ✅ Seguro: estamos en MainActor
        lhs.name == rhs.name && lhs.age == rhs.age
    }
}

// ✅ Uso desde MainActor — funciona
@MainActor func checkProfiles() {
    let a = UserProfile()
    let b = UserProfile()
    if a == b { print("Iguales") } // ✅
}

// ❌ El compilador previene uso desde otro contexto
// nonisolated func unsafeCheck(a: UserProfile,
//                               b: UserProfile) -> Bool {
//     a == b // Error: isolated conformance
// }`
        : `@MainActor
class UserProfile: Equatable {
    var name: String = ""
    var age: Int = 0

    // The conformance is implicitly isolated to MainActor
    // Only works when called from MainActor
    static func == (
        lhs: UserProfile, rhs: UserProfile
    ) -> Bool {
        // ✅ Safe: we're on MainActor
        lhs.name == rhs.name && lhs.age == rhs.age
    }
}

// ✅ Usage from MainActor — works
@MainActor func checkProfiles() {
    let a = UserProfile()
    let b = UserProfile()
    if a == b { print("Equal") } // ✅
}

// ❌ The compiler prevents usage from another context
// nonisolated func unsafeCheck(a: UserProfile,
//                               b: UserProfile) -> Bool {
//     a == b // Error: isolated conformance
// }`} />
      <Callout type="info">
        {l
          ? <>Especialmente útil con <Code>Equatable</Code>, <Code>Hashable</Code>, <Code>Comparable</Code> e <Code>Identifiable</Code> en tipos <Code>@MainActor</Code>.</>
          : <>Especially useful with <Code>Equatable</Code>, <Code>Hashable</Code>, <Code>Comparable</Code> and <Code>Identifiable</Code> on <Code>@MainActor</Code> types.</>}
      </Callout>
    </div>
  );
}

function SendableSection({ lang }: { lang: Lang }) {
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: theme.text }}>
        <Code>InferSendableFromCaptures</Code>{" "}
        {l
          ? <>hace que el compilador infiera <Code>@Sendable</Code> automáticamente para métodos y key-path literals cuando es seguro. <strong style={{ color: theme.headingText }}>Ya activo en Swift 6.</strong></>
          : <>makes the compiler automatically infer <Code>@Sendable</Code> for methods and key-path literals when safe. <strong style={{ color: theme.headingText }}>Already active in Swift 6.</strong></>}
      </p>
      <CodeBlock title={l ? "❌ Antes — Boilerplate manual" : "❌ Before — Manual boilerplate"} highlight="bad" code={l
        ? `struct User: Sendable {
    var name: String
    var email: String
}

// Necesitabas marcar @Sendable explícitamente
let getName: @Sendable (User) -> String = \\.name

Task.detached {
    // ❌ Warning: passing non-sendable parameter
    let names = users.map { $0.name }
}`
        : `struct User: Sendable {
    var name: String
    var email: String
}

// You had to mark @Sendable explicitly
let getName: @Sendable (User) -> String = \\.name

Task.detached {
    // ❌ Warning: passing non-sendable parameter
    let names = users.map { $0.name }
}`} />
      <CodeBlock title={l ? "✅ Ahora — El compilador lo infiere" : "✅ Now — The compiler infers it"} highlight="good" code={l
        ? `struct User: Sendable {
    var name: String
    var email: String
}

// Automáticamente Sendable (User es Sendable)
let keyPath = \\User.name  // ✅ Inferido

Task.detached {
    // ✅ Sin warnings — inferido como seguro
    let names = users.map { $0.name }
}`
        : `struct User: Sendable {
    var name: String
    var email: String
}

// Automatically Sendable (User is Sendable)
let keyPath = \\User.name  // ✅ Inferred

Task.detached {
    // ✅ No warnings — inferred as safe
    let names = users.map { $0.name }
}`} />
      <Callout type="success">
        <strong>{l ? "Ya activo en Swift 6." : "Already active in Swift 6."}</strong>{" "}
        {l ? "Si usas Swift 6 language mode, esta feature ya está habilitada. Solo es relevante como upcoming feature en Swift 5 mode." : "If you use Swift 6 language mode, this feature is already enabled. Only relevant as an upcoming feature in Swift 5 mode."}
      </Callout>
    </div>
  );
}

function GlobalActorSection({ lang }: { lang: Lang }) {
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: theme.text }}>
        <Code>GlobalActorIsolatedTypesUsability</Code>{" "}
        {l
          ? <>elimina restricciones innecesarias en tipos con global actor, haciendo más fácil acceder a propiedades <Code>Sendable</Code>, trabajar con closures y herencia. <strong style={{ color: theme.headingText }}>Ya activo en Swift 6.</strong></>
          : <>removes unnecessary restrictions on global actor types, making it easier to access <Code>Sendable</Code> properties, work with closures and inheritance. <strong style={{ color: theme.headingText }}>Already active in Swift 6.</strong></>}
      </p>
      <CodeBlock title={l ? "✅ Mejoras de usabilidad" : "✅ Usability improvements"} highlight="good" code={l
        ? `@MainActor
struct AppSettings {
    // Propiedades Sendable accesibles más fácilmente
    let appName: String = "MyApp"  // String es Sendable
    let version: Int = 1           // Int es Sendable
}

// Subclases pueden añadir global actor isolation
class BaseController {
    func load() { }
}

@MainActor
class UIController: BaseController {
    // ✅ Antes causaba error, ahora permitido
    override func load() { updateUI() }
    func updateUI() { }
}

// Closures en tipos @MainActor inferidas como @Sendable
// cuando es seguro — sin anotación manual`
        : `@MainActor
struct AppSettings {
    // Sendable properties accessible more easily
    let appName: String = "MyApp"  // String is Sendable
    let version: Int = 1           // Int is Sendable
}

// Subclasses can add global actor isolation
class BaseController {
    func load() { }
}

@MainActor
class UIController: BaseController {
    // ✅ Previously caused an error, now allowed
    override func load() { updateUI() }
    func updateUI() { }
}

// Closures on @MainActor types inferred as @Sendable
// when safe — no manual annotation`} />
      <Callout type="success">
        <strong>{l ? "Ya activo en Swift 6." : "Already active in Swift 6."}</strong>{" "}
        {l ? "Si estás en Swift 6, no necesitas hacer nada." : "If you're on Swift 6, you don't need to do anything."}
      </Callout>
    </div>
  );
}

function OutwardSection({ lang }: { lang: Lang }) {
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: theme.text }}>
        <Code>DisableOutwardActorInference</Code>{" "}
        {l
          ? <>elimina la regla donde un property wrapper como <Code>@StateObject</Code> propagaba su aislamiento a todo el tipo que lo usa. <strong style={{ color: theme.headingText }}>Ya activo en Swift 6 desde Swift 5.9.</strong></>
          : <>removes the rule where a property wrapper like <Code>@StateObject</Code> propagated its isolation to the entire type that uses it. <strong style={{ color: theme.headingText }}>Already active in Swift 6 since Swift 5.9.</strong></>}
      </p>
      <CodeBlock title={l ? "❌ Antes — Propagación sorpresiva" : "❌ Before — Surprising propagation"} highlight="bad" code={l
        ? `struct MyView: View {
    @StateObject var viewModel = ViewModel()
    // ⚠️ TODO MyView se volvía @MainActor
    // solo porque @StateObject es @MainActor internamente
    // Cambiar un property wrapper rompía código no relacionado
    var body: some View { Text("Hello") }
}`
        : `struct MyView: View {
    @StateObject var viewModel = ViewModel()
    // ⚠️ ALL of MyView became @MainActor
    // just because @StateObject is @MainActor internally
    // Changing a property wrapper broke unrelated code
    var body: some View { Text("Hello") }
}`} />
      <CodeBlock title={l ? "✅ Ahora — Sin propagación implícita" : "✅ Now — No implicit propagation"} highlight="good" code={l
        ? `struct MyView: View {
    @StateObject var viewModel = ViewModel()
    // ✅ MyView NO hereda @MainActor de @StateObject
    // Si necesitas MainActor, lo declaras explícitamente
    var body: some View { Text("Hello") }
}`
        : `struct MyView: View {
    @StateObject var viewModel = ViewModel()
    // ✅ MyView does NOT inherit @MainActor from @StateObject
    // If you need MainActor, you declare it explicitly
    var body: some View { Text("Hello") }
}`} />
      <Callout type="success">
        <strong>{l ? "La más antigua del grupo." : "The oldest in the group."}</strong>{" "}
        {l ? "Implementada desde Swift 5.9, activa en Swift 6." : "Implemented since Swift 5.9, active in Swift 6."}
      </Callout>
    </div>
  );
}

function MigrationSection({ lang }: { lang: Lang }) {
  const [scenario, setScenario] = useState("recommended");
  const theme = useTheme();
  const l = lang === "es";
  return (
    <div>
      <SectionTitle>{l ? "Selecciona tu escenario" : "Select your scenario"}</SectionTitle>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { id: "recommended", label: l ? "🎓 Config Recomendada (ACAcademy)" : "🎓 Recommended Config (ACAcademy)", desc: "Swift 6 + nonisolated + Approachable Yes" },
          { id: "new", label: l ? "🆕 Proyecto nuevo Xcode 26" : "🆕 New Xcode 26 project", desc: "Swift 6 + MainActor + Approachable Yes" },
          { id: "existing6", label: l ? "📦 Existente en Swift 6" : "📦 Existing Swift 6", desc: l ? "Migrando a Approachable Concurrency" : "Migrating to Approachable Concurrency" },
          { id: "existing5", label: l ? "🔄 Existente en Swift 5" : "🔄 Existing Swift 5", desc: l ? "Adopción gradual" : "Gradual adoption" },
        ].map(s => (
          <button key={s.id} onClick={() => setScenario(s.id)} style={{ flex: "1 1 calc(50% - 3px)", padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: scenario === s.id ? theme.buttonBg : theme.surface, color: scenario === s.id ? theme.buttonText : theme.textMuted, fontWeight: 600, fontSize: 12, transition: "all 0.2s", textAlign: "left" }}>
            <div>{s.label}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{s.desc}</div>
          </button>
        ))}
      </div>
      {scenario === "recommended" && (
        <div>
          <Callout type="expert">
            <strong>{l ? "Esta es la config recomendada" : "This is the recommended config"}</strong>{" "}
            {l
              ? <>si ya entiendes concurrencia. Donny Wals confirma que para SPM Packages, <Code>nonisolated</Code> es mejor default. Esta config funciona consistentemente entre app targets y packages.</>
              : <>if you already understand concurrency. Donny Wals confirms that for SPM Packages, <Code>nonisolated</Code> is the better default. This config works consistently between app targets and packages.</>}
          </Callout>
          <Table headers={["Setting", l ? "Valor" : "Value", l ? "Efecto" : "Effect"]} rows={l
            ? [["Swift Language Version", "6 — Complete", "Garantía total contra data races"], ["Default Actor Isolation", "nonisolated", "Tú controlas qué va en MainActor"], ["Approachable Concurrency", "Yes", "nonsending + isolated conformances"]]
            : [["Swift Language Version", "6 — Complete", "Full data race safety guarantee"], ["Default Actor Isolation", "nonisolated", "You control what goes on MainActor"], ["Approachable Concurrency", "Yes", "nonsending + isolated conformances"]]} />
          <CodeBlock title={l ? "Build Settings en Xcode" : "Build Settings in Xcode"} code={l
            ? `// En Xcode Build Settings:
// Swift Compiler - Language:
//   Swift Language Version: Swift 6
//   Strict Concurrency: Complete
//
// Swift Compiler - Upcoming Features:
//   Approachable Concurrency: Yes
//   Default Actor Isolation: nonisolated
//
// Equivalente en Package.swift:
.target(
    name: "MyTarget",
    swiftSettings: [
        // NO ponemos .defaultIsolation(MainActor.self)
        // → nonisolated es el default
        .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
        .enableUpcomingFeature("InferIsolatedConformances"),
    ]
)`
            : `// In Xcode Build Settings:
// Swift Compiler - Language:
//   Swift Language Version: Swift 6
//   Strict Concurrency: Complete
//
// Swift Compiler - Upcoming Features:
//   Approachable Concurrency: Yes
//   Default Actor Isolation: nonisolated
//
// Equivalent in Package.swift:
.target(
    name: "MyTarget",
    swiftSettings: [
        // We DON'T use .defaultIsolation(MainActor.self)
        // → nonisolated is the default
        .enableUpcomingFeature("NonisolatedNonsendingByDefault"),
        .enableUpcomingFeature("InferIsolatedConformances"),
    ]
)`} />
          <SectionTitle>{l ? "Modelo mental con esta config" : "Mental model with this config"}</SectionTitle>
          <CodeBlock title={l ? "Patrón de trabajo diario" : "Daily workflow pattern"} highlight="good" code={l
            ? `// ═══════════════════════════════════════════
// REGLA 1: UI / ViewModels → @MainActor explícito
// ═══════════════════════════════════════════
@MainActor
class ProductViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false

    private let service = ProductService()

    func load() async {
        isLoading = true
        // service.fetchAll() hereda MainActor (nonsending)
        products = (try? await service.fetchAll()) ?? []
        isLoading = false
    }
}

// ═══════════════════════════════════════════
// REGLA 2: Services / Repos → nonisolated (default)
// Heredan el actor de quien los llame
// ═══════════════════════════════════════════
class ProductService {
    // nonisolated(nonsending) — default
    // Si ViewModel lo llama → corre en MainActor
    // Si un actor custom lo llama → corre en ese actor
    func fetchAll() async throws -> [Product] {
        let (data, _) = try await URLSession
            .shared.data(from: url)
        return try JSONDecoder()
            .decode([Product].self, from: data)
    }
}

// ═══════════════════════════════════════════
// REGLA 3: Trabajo pesado → @concurrent
// ═══════════════════════════════════════════
class ImagePipeline {
    @concurrent
    func resize(_ image: UIImage, to size: CGSize) async
        -> UIImage {
        // Global executor (background thread)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }
}

// ═══════════════════════════════════════════
// RESUMEN:
// @MainActor     → ViewModels, UI controllers
// (nada/default) → Services, repos, utilities
// @concurrent    → CPU-heavy processing
// ═══════════════════════════════════════════`
            : `// ═══════════════════════════════════════════
// RULE 1: UI / ViewModels → explicit @MainActor
// ═══════════════════════════════════════════
@MainActor
class ProductViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false

    private let service = ProductService()

    func load() async {
        isLoading = true
        // service.fetchAll() inherits MainActor (nonsending)
        products = (try? await service.fetchAll()) ?? []
        isLoading = false
    }
}

// ═══════════════════════════════════════════
// RULE 2: Services / Repos → nonisolated (default)
// They inherit the actor from whoever calls them
// ═══════════════════════════════════════════
class ProductService {
    // nonisolated(nonsending) — default
    // If ViewModel calls it → runs on MainActor
    // If a custom actor calls it → runs there
    func fetchAll() async throws -> [Product] {
        let (data, _) = try await URLSession
            .shared.data(from: url)
        return try JSONDecoder()
            .decode([Product].self, from: data)
    }
}

// ═══════════════════════════════════════════
// RULE 3: Heavy work → @concurrent
// ═══════════════════════════════════════════
class ImagePipeline {
    @concurrent
    func resize(_ image: UIImage, to size: CGSize) async
        -> UIImage {
        // Global executor (background thread)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }
}

// ═══════════════════════════════════════════
// SUMMARY:
// @MainActor     → ViewModels, UI controllers
// (nothing/default) → Services, repos, utilities
// @concurrent    → CPU-heavy processing
// ═══════════════════════════════════════════`} />
        </div>
      )}
      {scenario === "new" && (
        <div>
          <Callout type="success">
            {l
              ? <>Xcode 26 activa todo por defecto. <strong>No necesitas hacer nada</strong> — tu código es single-threaded hasta que tú dices lo contrario con <Code>@concurrent</Code>.</>
              : <>Xcode 26 enables everything by default. <strong>You don't need to do anything</strong> — your code is single-threaded until you say otherwise with <Code>@concurrent</Code>.</>}
          </Callout>
          <Table headers={["Setting", l ? "Valor" : "Value", l ? "Acción" : "Action"]} rows={[
            ["Default Actor Isolation", "MainActor ✅", l ? "Automático" : "Automatic"],
            ["Approachable Concurrency", "Yes ✅", l ? "Automático" : "Automatic"],
            ["Swift Language Version", "Swift 6 ✅", l ? "Automático" : "Automatic"],
          ]} />
          <CodeBlock title={l ? "Modelo mental para proyectos nuevos" : "Mental model for new projects"} code={l
            ? `// Todo es @MainActor por defecto — no necesitas anotarlo
class DataService {
    func fetchUser() async throws -> User {
        // Corre en MainActor (inferido)
        let (data, _) = try await URLSession
            .shared.data(from: url)
        return try JSONDecoder()
            .decode(User.self, from: data)
    }

    // Solo marcas @concurrent para background
    @concurrent
    func processDataset(_ d: Data) async -> [Result] {
        return heavyComputation(d)
    }
}`
            : `// Everything is @MainActor by default — no annotation needed
class DataService {
    func fetchUser() async throws -> User {
        // Runs on MainActor (inferred)
        let (data, _) = try await URLSession
            .shared.data(from: url)
        return try JSONDecoder()
            .decode(User.self, from: data)
    }

    // Only mark @concurrent for background
    @concurrent
    func processDataset(_ d: Data) async -> [Result] {
        return heavyComputation(d)
    }
}`} />
        </div>
      )}
      {scenario === "existing6" && (
        <div>
          <Callout type="warning">
            {l
              ? <>En Swift 6, solo 2 flags son nuevas. <strong>Migra antes de activar</strong>, especialmente <Code>NonisolatedNonsendingByDefault</Code>.</>
              : <>In Swift 6, only 2 flags are new. <strong>Migrate before enabling</strong>, especially <Code>NonisolatedNonsendingByDefault</Code>.</>}
          </Callout>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
            {[
              { step: "1", text: l ? "Activa InferIsolatedConformances (bajo riesgo)" : "Enable InferIsolatedConformances (low risk)", risk: "🟢" },
              { step: "2", text: l ? "Revisa tus métodos nonisolated async y añade @concurrent donde necesites background" : "Review your nonisolated async methods and add @concurrent where you need background", risk: "🟡" },
              { step: "3", text: l ? "Activa NonisolatedNonsendingByDefault" : "Enable NonisolatedNonsendingByDefault", risk: l ? "🔴 si no hiciste paso 2" : "🔴 if you skipped step 2" },
            ].map(s => (
              <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: theme.surface, border: `1px solid ${theme.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: theme.buttonBg, color: theme.buttonText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
                <div style={{ flex: 1, fontSize: 13, color: theme.text }}>{s.text}</div>
                <span style={{ fontSize: 12 }}>{s.risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {scenario === "existing5" && (
        <div>
          <Callout type="info">
            {l
              ? "Adopta gradualmente. Las 3 flags que ya están en Swift 6 son seguras de activar primero como upcoming features."
              : "Adopt gradually. The 3 flags already in Swift 6 are safe to enable first as upcoming features."}
          </Callout>
          <Table headers={[l ? "Prioridad" : "Priority", "Feature Flag", l ? "Riesgo" : "Risk"]} rows={[
            [l ? "1ª" : "1st", "DisableOutwardActorInference", l ? "🟢 Bajo" : "🟢 Low"],
            [l ? "2ª" : "2nd", "GlobalActorIsolatedTypesUsability", l ? "🟢 Bajo" : "🟢 Low"],
            [l ? "3ª" : "3rd", "InferSendableFromCaptures", l ? "🟢 Bajo" : "🟢 Low"],
            [l ? "4ª" : "4th", "InferIsolatedConformances", l ? "🟡 Medio" : "🟡 Medium"],
            [l ? "5ª" : "5th", "NonisolatedNonsendingByDefault", l ? "🔴 Migrar primero" : "🔴 Migrate first"],
          ]} />
        </div>
      )}
    </div>
  );
}

// ─── NAVIGATION ───

function getSections(lang: Lang) {
  const l = lang === "es";
  return [
    { id: "overview", title: "Overview", icon: "⚡", color: "teal" as ColorKey, subtitle: "Approachable Concurrency" },
    { id: "config", title: l ? "Config Recomendada" : "Recommended Config", icon: "🎓", color: "purple" as ColorKey, subtitle: l ? "Recomendada por Julio César Fernández (ACAcademy)" : "Recommended by Julio César Fernández (ACAcademy)" },
    { id: "nonsending", title: "Nonsending", icon: "🔄", color: "blue" as ColorKey, subtitle: l ? "SE-0461 · La más importante" : "SE-0461 · The most important" },
    { id: "conformances", title: "Conformances", icon: "🔗", color: "coral" as ColorKey, subtitle: l ? "SE-0470 · Aisladas" : "SE-0470 · Isolated" },
    { id: "sendable", title: "Sendable", icon: "📤", color: "green" as ColorKey, subtitle: l ? "SE-0418 · Inferencia" : "SE-0418 · Inference" },
    { id: "globalactor", title: "Global Actor", icon: "🌐", color: "amber" as ColorKey, subtitle: l ? "SE-0434 · Usabilidad" : "SE-0434 · Usability" },
    { id: "outward", title: "Outward", icon: "🛡", color: "gray" as ColorKey, subtitle: "SE-0401 · Wrappers" },
    { id: "migration", title: l ? "Migración" : "Migration", icon: "🎯", color: "red" as ColorKey, subtitle: l ? "Guía de decisión" : "Decision guide" },
  ];
}

const sectionComponents: Record<string, (props: { lang: Lang }) => JSX.Element> = {
  overview: OverviewSection,
  config: RecommendedConfigSection,
  nonsending: NonsendingSection,
  conformances: ConformancesSection,
  sendable: SendableSection,
  globalactor: GlobalActorSection,
  outward: OutwardSection,
  migration: MigrationSection,
};

// ─── MAIN COMPONENT ───

export default function Swift6ConcurrencyGuide({ lang = "es" }: { lang?: Lang }) {
  const [active, setActive] = useState("overview");
  const theme = useTheme();
  const sections = getSections(lang);
  const section = sections.find(s => s.id === active)!;
  const Content = sectionComponents[active];
  const c = colorMap[section.color];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px", borderRadius: 16, marginBottom: 20, background: `linear-gradient(135deg, ${c.bg} 0%, ${theme.headerGradientEnd} 100%)`, border: `1px solid ${c.light}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -10, fontSize: 80, opacity: 0.08, fontWeight: 900, color: c.dark }}>6.2</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32 }}>{section.icon}</span>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: c.text, letterSpacing: -0.5 }}>{section.title}</h1>
            <p style={{ fontSize: 14, color: c.border, margin: "3px 0 0", fontWeight: 500 }}>{section.subtitle}</p>
          </div>
        </div>
      </div>
      {/* Nav */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 20, padding: "5px", background: theme.navBg, borderRadius: 12 }}>
        {sections.map(s => {
          const sc = colorMap[s.color];
          const isActive = active === s.id;
          return (
            <button key={s.id} onClick={() => setActive(s.id)} style={{ padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: isActive ? theme.navActiveBg : "transparent", boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none", color: isActive ? (theme.navActiveText ?? sc.text) : theme.textMuted, fontWeight: isActive ? 700 : 500, fontSize: 11.5, transition: "all 0.15s", whiteSpace: "nowrap" }}>
              <span style={{ marginRight: 3 }}>{s.icon}</span>{s.title}
            </button>
          );
        })}
      </div>
      {/* Content */}
      <div style={{ padding: "28px", borderRadius: 16, background: theme.bg, border: `1px solid ${theme.border}`, minHeight: 400, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <Content lang={lang} />
      </div>
      {/* Footer */}
      <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12, background: theme.surface, fontSize: 11, color: theme.textFaint, lineHeight: 1.6 }}>
        <strong style={{ color: theme.textMuted }}>{lang === "es" ? "Fuentes verificadas:" : "Verified sources:"}</strong>{" "}
        Apple Swift Evolution (SE-0461, SE-0466, SE-0470, SE-0434, SE-0401) ·{" "}
        Hacking with Swift (Paul Hudson) · SwiftLee (Antoine van der Lee) ·{" "}
        Donny Wals · <a href="https://www.linkedin.com/in/jcfmunoz" style={{ color: theme.textFaint }} target="_blank" rel="noopener noreferrer">Julio César Fernández</a> · <a href="https://acoding.academy" style={{ color: theme.textFaint }} target="_blank" rel="noopener noreferrer">Apple Coding Academy</a> · Swift Forums
      </div>
    </div>
  );
}
