import { usePosts } from "@/hooks/use-posts";
import { PostItem } from "@/components/PostItem";
import { AgeGate } from "@/components/AgeGate";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: posts, isLoading, error } = usePosts();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="font-serif text-gray-400">Algo deu errado. Tente recarregar.</p>
      </div>
    );
  }

  const visiblePosts = posts?.filter(p => p.isVisible) || [];

  return (
    <>
      <AgeGate />
      
      <main className="min-h-screen bg-white pb-32">
        <div className="max-w-4xl mx-auto">
          {visiblePosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center px-4">
              <p className="font-serif text-2xl text-gray-300 italic">
                "O silêncio é a única resposta que se deve dar aos tolos."
              </p>
              <p className="mt-4 font-sans text-xs text-gray-200 uppercase tracking-widest">
                Sem posts por enquanto
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {visiblePosts.map((post, index) => (
                <PostItem key={post.id} post={post} index={index} />
              ))}
            </div>
          )}
        </div>
        
        <footer className="w-full py-12 text-center border-t border-gray-50 mt-20">
          <p className="font-sans text-[10px] text-gray-300 uppercase tracking-widest">
            Claramente Não Sou um Escritor &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </>
  );
}
