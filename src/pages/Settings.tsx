import { useEffect, useState } from "react";
import { Check, Languages } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";

const LANGUAGES: Array<{ id: Language; labelKey: "chinese" | "english"; note: string }> = [
  { id: "zh", labelKey: "chinese", note: "简体中文" },
  { id: "en", labelKey: "english", note: "English" },
];

export default function Settings() {
  const { language, setLanguage, t } = useI18n();
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem("omp-switch-reduce-motion") === "true");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("omp-switch-font-size") || "1");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("omp-switch-high-contrast") === "true");

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
    localStorage.setItem("omp-switch-reduce-motion", String(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-size-multiplier", fontSize);
    localStorage.setItem("omp-switch-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("omp-switch-high-contrast", String(highContrast));
  }, [highContrast]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#1db7f7]">Settings</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{t("languageSettings")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("languageSubtitle")}</p>
        </div>
        <div className="rounded-3xl border border-[#222] bg-[#050505] p-4 text-right">
          <div className="font-mono text-2xl font-semibold text-white">{language.toUpperCase()}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("currentLanguage")}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-transparent bg-[linear-gradient(#050505,#050505)_padding-box,linear-gradient(90deg,#222,#222)_border-box] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="pi-gradient-bg flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_0_32px_rgba(29,183,247,0.18)]">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{t("language")}</h2>
            <p className="text-sm text-muted-foreground">{t("languageSubtitle")}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {LANGUAGES.map((item) => {
            const active = language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id)}
                className={`group flex items-center justify-between rounded-3xl border px-5 py-4 text-left transition duration-300 ${active ? "border-transparent bg-[linear-gradient(90deg,#1db7f7,#b600f8)] text-white" : "border-[#222] bg-[#1f1f1f] text-muted-foreground hover:border-transparent hover:bg-[linear-gradient(90deg,#1db7f7,#b600f8)] hover:text-white"}`}
              >
                <div>
                  <div className="text-lg font-semibold">{t(item.labelKey)}</div>
                  <div className="mt-1 text-sm opacity-75">{item.note}</div>
                </div>
                {active && <Check className="h-5 w-5" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-5 border-t border-[#222] pt-5">
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#222] bg-[#1f1f1f] px-5 py-4 text-sm text-muted-foreground">
            <span className="font-semibold text-white">{t("reduceMotion")}</span>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              className="h-4 w-4 accent-[#1db7f7]"
            />
          </label>

          <div className="rounded-2xl border border-[#222] bg-[#1f1f1f] px-5 py-4">
            <div className="mb-3 text-sm font-semibold text-white">{t("fontSize")}</div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "0.875", label: t("small") },
                { value: "1", label: t("medium") },
                { value: "1.125", label: t("large") },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFontSize(item.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${fontSize === item.value ? "pi-gradient-bg text-white" : "bg-[#050505] text-muted-foreground hover:text-white"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#222] bg-[#1f1f1f] px-5 py-4 text-sm text-muted-foreground">
            <span className="font-semibold text-white">{t("highContrast")}</span>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="h-4 w-4 accent-[#1db7f7]"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
