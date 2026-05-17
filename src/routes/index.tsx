import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchPagina } from "../utils/fetchPagina";
import { parseContent } from "../utils/parseContent";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// 1. Registrar a rota no TanStack Router (Isso remove o aviso e faz a página funcionar)
export const Route = createFileRoute("/")({
  component: Index,
});

interface ConteudoParseado {
  titulos: Element[];
  paragrafos: Element[];
  imagens: Element[];
  listas: Element[];
}

function Index() {
  const [conteudo, setConteudo] = useState<ConteudoParseado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDadosDoWordPress() {
      try {
        const dadosPagina = await fetchPagina("pagina-1");
        
        if (dadosPagina?.content?.rendered) {
          const resultado = parseContent(dadosPagina.content.rendered);
          setConteudo(resultado);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do WordPress:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosDoWordPress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">A carregar conteúdo dinâmico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-75" />
        </div>

        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm text-sm text-indigo-400">
            <Star className="w-4 h-4 fill-current" />
            <span>O gerenciador definitivo</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            {conteudo?.titulos[0]?.textContent || "Eleve a sua"}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 block mt-2">
              {conteudo?.titulos[1]?.textContent || "Produtividade"}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            {conteudo?.paragrafos[0]?.textContent || "Gerencie suas tarefas de forma simples, rápida e extremamente visual."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 px-8 py-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 group">
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold px-8 py-6 rounded-xl transition-all duration-200">
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}