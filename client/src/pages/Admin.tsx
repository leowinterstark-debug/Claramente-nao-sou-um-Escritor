import { useState, useEffect } from "react";
import { useCreatePost } from "@/hooks/use-posts";
import { useAuthCheck, useLogout } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, LogOut } from "lucide-react";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { data: auth, isLoading: authLoading } = useAuthCheck();
  const { mutate: logout } = useLogout();
  const { mutate: createPost, isPending } = useCreatePost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Protected route logic
  useEffect(() => {
    if (!authLoading && !auth?.isAuthenticated) {
      setLocation("/login");
    }
  }, [auth, authLoading, setLocation]);

  const handleSuggest = async () => {
    if (!content) return;
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha na sugestão");
      const data = await res.json();
      setContent(data.suggestion);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    createPost(
      { 
        title: title || null, 
        content, 
        coverImageUrl: coverImageUrl || null,
        bodyImageUrl: null,
        isVisible: true
      },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setCoverImageUrl("");
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        }
      }
    );
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => setLocation("/")
    });
  };

  if (authLoading || !auth?.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-sm z-10 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <span className="font-sans text-xs text-gray-400 uppercase tracking-widest">
          Nova Publicação
        </span>
        <button 
          onClick={handleLogout}
          className="text-gray-400 hover:text-black transition-colors"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="pt-32 pb-20 max-w-2xl mx-auto px-6">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (opcional)"
            className="w-full text-4xl font-serif placeholder:text-gray-200 border-none focus:ring-0 p-0 bg-transparent"
          />

          {/* Content Textarea */}
          <div className="relative group">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comece a escrever..."
              className="w-full min-h-[40vh] text-lg font-serif leading-relaxed placeholder:text-gray-200 border-none focus:ring-0 p-0 bg-transparent resize-none"
            />
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting || !content}
              className="absolute -right-12 top-0 p-2 text-gray-200 hover:text-black transition-colors disabled:opacity-30"
              title="Sugerir ajustes com IA"
            >
              <Loader2 className={`w-5 h-5 ${isSuggesting ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Image URL Input */}
          <div className="border-t border-gray-100 pt-8">
            <label className="block font-sans text-xs text-gray-400 uppercase tracking-widest mb-2">
              Imagem de capa (URL)
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full font-mono text-sm text-gray-600 bg-gray-50 border-none rounded-sm p-3 focus:ring-1 focus:ring-black/10"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-8">
            {success && (
              <span className="text-sm font-sans text-green-600 animate-pulse">
                Publicado com sucesso.
              </span>
            )}
            
            <button
              type="submit"
              disabled={isPending || !content}
              className="px-8 py-3 bg-black text-white font-sans text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
