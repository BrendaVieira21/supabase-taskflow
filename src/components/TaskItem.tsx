import { useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { Task } from "@/lib/tasks";

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task, newTitle: string) => Promise<void> | void;
}

export function TaskItem({ task, onToggle, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === task.title) {
      setEditing(false);
      setDraft(task.title);
      return;
    }
    await onEdit(task, trimmed);
    setEditing(false);
  };

  return (
    <li className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
      <button
        onClick={() => onToggle(task)}
        aria-label={task.completed ? "Marcar como pendente" : "Marcar como concluída"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
          task.completed
            ? "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground"
            : "border-border hover:border-primary"
        }`}
      >
        {task.completed && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setEditing(false);
              setDraft(task.title);
            }
          }}
          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-ring/50 focus:ring-2"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={`flex-1 select-none text-sm transition-all ${
            task.completed ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.title}
        </span>
      )}

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {editing ? (
          <button
            onClick={save}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Salvar"
          >
            <Check className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(task)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export const _x = X; // keep import tree-shake friendly