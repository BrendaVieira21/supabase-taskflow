import { useEffect, useMemo, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Plus, Search, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TaskItem } from "@/components/TaskItem";
import type { Task, Filter } from "@/lib/tasks";

export const Route = createFileRoute("/")({
  component: TodoPage,
});

function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) toast.error("Erro ao carregar tarefas");
      else setTasks(data ?? []);
      setLoading(false);
    })();

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          setTasks((prev) => {
            if (payload.eventType === "INSERT") {
              const t = payload.new as Task;
              if (prev.some((p) => p.id === t.id)) return prev;
              return [t, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const t = payload.new as Task;
              return prev.map((p) => (p.id === t.id ? t : p));
            }
            if (payload.eventType === "DELETE") {
              const t = payload.old as Task;
              return prev.filter((p) => p.id !== t.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setAdding(true);
    const { error } = await supabase.from("tasks").insert({ title: value });
    setAdding(false);
    if (error) {
      toast.error("Não foi possível adicionar");
      return;
    }
    setTitle("");
    inputRef.current?.focus();
    toast.success("Tarefa adicionada");
  };

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);
    if (error) toast.error("Erro ao atualizar");
  };

  const deleteTask = async (task: Task) => {
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) toast.error("Erro ao excluir");
    else toast.success("Tarefa removida");
  };

  const editTask = async (task: Task, newTitle: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ title: newTitle })
      .eq("id", task.id);
    if (error) toast.error("Erro ao editar");
    else toast.success("Tarefa atualizada");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter === "pending" && t.completed) return false;
      if (filter === "completed" && !t.completed) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, filter, search]);

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    return { total: tasks.length, completed, pending: tasks.length - completed };
  }, [tasks]);

  return (
    <main className="min-h-screen bg-[image:var(--gradient-surface)]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <ListChecks className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Minhas Tarefas
            </h1>
            <p className="text-sm text-muted-foreground">
              {stats.pending} pendentes · {stats.completed} concluídas
            </p>
          </div>
        </header>

        <form onSubmit={addTask} className="mb-4 flex gap-2">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="flex-1 rounded-xl border border-input bg-card px-4 py-3 text-sm shadow-[var(--shadow-soft)] outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            disabled={adding || !title.trim()}
            className="flex items-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:opacity-90 disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </form>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            {(["all", "pending", "completed"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === f
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : "Concluídas"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {tasks.length === 0
                ? "Nenhuma tarefa ainda. Adicione a primeira acima!"
                : "Nada encontrado com esses filtros."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={editTask}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
