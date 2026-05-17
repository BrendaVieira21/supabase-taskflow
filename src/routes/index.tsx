import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ListTodo, Loader2, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Filter, Task } from "@/lib/tasks";
import { TaskItem } from "@/components/TaskItem";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tarefas — To-Do moderno" },
      { name: "description", content: "Lista de tarefas reativa com sincronização em tempo real." },
    ],
  }),
  component: Index,
});

function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mounted) return;
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
              const next = payload.new as Task;
              if (prev.some((t) => t.id === next.id)) return prev;
              return [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Task;
              return prev.map((t) => (t.id === next.id ? next : t));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Task;
              return prev.filter((t) => t.id !== old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter === "pending" && t.completed) return false;
      if (filter === "completed" && !t.completed) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, search, filter]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks]
  );

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setAdding(true);
    const { error } = await supabase.from("tasks").insert({ title });
    setAdding(false);
    if (error) {
      toast.error("Não foi possível adicionar");
      return;
    }
    setDraft("");
    toast.success("Tarefa adicionada");
  };

  const toggleTask = async (task: Task) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);
    if (error) {
      setTasks(prev);
      toast.error("Erro ao atualizar");
    }
  };

  const deleteTask = async (task: Task) => {
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      setTasks(prev);
      toast.error("Erro ao excluir");
    } else {
      toast.success("Tarefa removida");
    }
  };

  const editTask = async (task: Task, title: string) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, title } : t)));
    const { error } = await supabase.from("tasks").update({ title }).eq("id", task.id);
    if (error) {
      setTasks(prev);
      toast.error("Erro ao editar");
    } else {
      toast.success("Tarefa atualizada");
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Pendentes" },
    { key: "completed", label: "Concluídas" },
  ];

  return (
    <main className="min-h-screen bg-[image:var(--gradient-surface)] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Minhas Tarefas</h1>
            <p className="text-sm text-muted-foreground">
              {stats.total} no total · {stats.pending} pendentes · {stats.completed} concluídas
            </p>
          </div>
        </header>

        <form
          onSubmit={addTask}
          className="mb-4 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-soft)]"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="submit"
            disabled={adding || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Adicionar
          </button>
        </form>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarefas..."
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none ring-ring/40 focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            {tasks.length === 0 ? (
              <>
                <ListTodo className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Nenhuma tarefa ainda</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Adicione sua primeira tarefa acima para começar.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Nada por aqui</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tente ajustar o filtro ou a busca.
                </p>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
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
