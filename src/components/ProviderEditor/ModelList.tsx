import type { ModelDefinition } from "@/types/provider";
import { useMemo } from "react";
import { Bot } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  models: ModelDefinition[];
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
}

function ModelCard({ model, index, onEdit, onDelete }: {
  model: ModelDefinition;
  index: number;
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
}) {
  const { t } = useI18n();
  const badges = useMemo(() => {
    const list: { label: string; variant: "primary" | "secondary" | "muted" }[] = [];
    if (model.reasoning) list.push({ label: "Reasoning", variant: "primary" });
    if (model.headers) list.push({ label: "Headers", variant: "secondary" });
    if (model.compat?.supportsStore) list.push({ label: "Store", variant: "muted" });
    if (model.compat?.supportsDeveloperRole) list.push({ label: "DevRole", variant: "muted" });
    return list;
  }, [model]);

  return (
    <div
      data-testid={`model-item-${model.id}`}
      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{model.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{model.id}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {(model.contextWindow ?? 0).toLocaleString()} ctx · {(model.maxTokens ?? 0).toLocaleString()} tok
          </span>
          {badges.map((b) => (
            <span
              key={b.label}
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                b.variant === "primary"
                  ? "bg-primary/10 text-primary"
                  : b.variant === "secondary"
                  ? "bg-secondary/80 text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          data-testid={`edit-model-${model.id}`}
          onClick={() => onEdit(index)}
          className="text-xs px-2.5 py-1.5 border rounded-md hover:bg-muted transition-colors"
          title={t("editModel")}
        >
          {t("edit")}
        </button>
        <button
          type="button"
          data-testid={`delete-model-${model.id}`}
          onClick={() => onDelete(index)}
          className="text-xs px-2.5 py-1.5 border rounded-md hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          title={t("deleteModel")}
        >
          {t("delete")}
        </button>
      </div>
    </div>
  );
}

export default function ModelList({ models, onEdit, onDelete }: Props) {
  const { t } = useI18n();
  if (models.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
        <Bot className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">{t("emptyModels")}</p>
        <p className="text-xs mt-1 opacity-60">{t("emptyModelsHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="model-list">
      {models.map((m, idx) => (
        <ModelCard key={m.id} model={m} index={idx} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
