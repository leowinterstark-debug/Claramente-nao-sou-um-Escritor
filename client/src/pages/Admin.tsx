import { useState, useEffect } from "react";
import { useCreatePost, usePosts } from "@/hooks/use-posts";
import { useAuthCheck, useLogout } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: auth, isLoading: authLoading } = useAuthCheck();
  const { mutate: logout } = useLogout();
  const { mutate: createPost, isPending } = useCreatePost();
  const { getUploadParameters } = useUpload();
  const { data: posts } = usePosts();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

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
          toast({
            title: "Sucesso",
            description: "Publicação criada com sucesso.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Erro ao publicar",
            description: error.message || "Ocorreu um erro inesperado.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => setLocation("/")
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta postagem?")) return;
    
    setIsDeleting(id);
    try {
      await apiRequest("DELETE", `/api/posts/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Sucesso",
        description: "Postagem excluída.",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a postagem.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (authLoading || !auth?.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-sm z-10 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <span className="font-sans text-xs text-gray-400 uppercase tracking-widest">
          Área Administrativa
        </span>
        <button 
          onClick={handleLogout}
          className="text-gray-400 hover:text-black transition-colors"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="pt-32 pb-20 max-w-2xl mx-auto px-6 space-y-20">
        <section>
          <h2 className="font-sans text-xs text-gray-400 uppercase tracking-widest mb-12">Nova Publicação</h2>
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
                disabled={isSuggesting || !content || content.length < 5}
                className="absolute -right-6 md:-right-16 top-0 w-12 h-12 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-black hover:bg-gray-50 transition-all disabled:opacity-0 shadow-md border border-gray-100"
                title="Sugerir ajustes com IA"
              >
                <Loader2 className={`w-6 h-6 ${isSuggesting ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Image URL Input & Preview */}
            <div className="border-t border-gray-100 pt-8">
              <div className="flex justify-between items-end mb-4">
                <label className="block font-sans text-xs text-gray-400 uppercase tracking-widest">
                  Imagem de capa
                </label>
                <ObjectUploader
                  onGetUploadParameters={getUploadParameters}
                  onComplete={(result: any) => {
                    const upload = result.successful?.[0];
                    if (upload) {
                      const path = (upload.response?.body as any)?.objectPath;
                      if (path) {
                        setCoverImageUrl(path);
                      }
                    }
                  }}
                  buttonClassName="h-8 px-3 text-[10px] uppercase tracking-tighter"
                >
                  Upload do Computador
                </ObjectUploader>
              </div>
              
              {coverImageUrl && (
                <div className="mb-6 w-full aspect-video bg-gray-50 overflow-hidden grayscale rounded-sm border border-gray-100">
                  <img 
                    src={coverImageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://i.postimg.cc/..."
                className="w-full font-mono text-xs text-gray-400 bg-transparent border-b border-gray-100 pb-2 focus:border-black focus:ring-0 transition-colors"
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
        </section>

        <section className="border-t border-gray-100 pt-20">
          <h2 className="font-sans text-xs text-gray-400 uppercase tracking-widest mb-12">Postagens Existentes</h2>
          <div className="space-y-6">
            {posts?.map((post) => (
              <div key={post.id} className="flex justify-between items-center group py-4 border-b border-gray-50">
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-serif text-lg truncate">{post.title || "Sem título"}</h3>
                  <p className="font-sans text-[10px] text-gray-300 uppercase tracking-widest">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Sem data"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={isDeleting === post.id}
                  className="text-gray-200 hover:text-red-600 transition-colors"
                  title="Excluir postagem"
                >
                  {isDeleting === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
