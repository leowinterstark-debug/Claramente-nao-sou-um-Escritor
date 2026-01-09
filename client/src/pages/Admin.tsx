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
      <main className="pt-12 pb-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-12">
            <header className="flex justify-between items-center mb-8">
              <h2 className="font-sans text-[10px] text-gray-400 uppercase tracking-widest">Nova Publicação</h2>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-[10px] text-gray-400 hover:text-black uppercase tracking-widest transition-colors"
              >
                Sair <LogOut className="w-3 h-3" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título (opcional)"
                className="w-full text-3xl font-serif placeholder:text-gray-100 border-none focus:ring-0 p-0 bg-transparent"
              />

              <div className="relative group border-l border-gray-50 pl-6">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Comece a escrever..."
                  className="w-full min-h-[30vh] text-lg font-serif leading-relaxed placeholder:text-gray-100 border-none focus:ring-0 p-0 bg-transparent resize-none"
                />
                <button
                  type="button"
                  onClick={handleSuggest}
                  disabled={isSuggesting || !content || content.length < 5}
                  className="absolute -right-4 top-0 w-10 h-10 flex items-center justify-center bg-white rounded-full text-gray-300 hover:text-black hover:shadow-sm transition-all disabled:opacity-0 border border-gray-50"
                  title="Sugerir ajustes com IA"
                >
                  <Loader2 className={`w-5 h-5 ${isSuggesting ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="pt-8 border-t border-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-sans text-[10px] text-gray-400 uppercase tracking-widest">Imagem de capa</span>
                  <ObjectUploader
                    onGetUploadParameters={getUploadParameters}
                    onComplete={(result: any) => {
                      const upload = result.successful?.[0];
                      if (upload) {
                        const path = upload.meta?.objectPath;
                        if (path) setCoverImageUrl(path);
                      }
                    }}
                    buttonClassName="h-7 px-4 text-[9px] uppercase tracking-widest variant-outline rounded-none"
                  >
                    Upload Local
                  </ObjectUploader>
                </div>
                
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="URL da imagem ou link de upload..."
                  className="w-full font-mono text-[10px] text-gray-400 bg-transparent border-b border-gray-50 pb-2 focus:border-black focus:ring-0 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-6 pt-4">
                {success && (
                  <span className="text-[10px] font-sans text-green-600 uppercase tracking-widest animate-pulse">
                    Publicado.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isPending || !content}
                  className="px-10 py-3 bg-black text-white font-sans text-[10px] uppercase tracking-[0.2em] hover:bg-gray-900 disabled:opacity-20 transition-all"
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Publicar"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: List & Preview */}
          <div className="lg:col-span-5 space-y-12">
            <section className="bg-gray-50/30 p-8 min-h-[200px]">
              <h2 className="font-sans text-[10px] text-gray-400 uppercase tracking-widest mb-8">Preview</h2>
              {coverImageUrl && (
                <div className="w-full aspect-[16/10] overflow-hidden grayscale mb-4">
                  <img src={coverImageUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
              )}
              <h3 className="font-serif text-xl mb-4">{title || "Sem título"}</h3>
              <p className="font-serif text-sm text-gray-500 line-clamp-3 leading-relaxed">{content || "O conteúdo aparecerá aqui..."}</p>
            </section>

            <section>
              <h2 className="font-sans text-[10px] text-gray-400 uppercase tracking-widest mb-8">Postagens</h2>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {posts?.map((post) => (
                  <div key={post.id} className="flex justify-between items-center py-4 group">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-serif text-sm truncate group-hover:text-gray-600 transition-colors">{post.title || "Sem título"}</h3>
                      <p className="font-sans text-[9px] text-gray-300 uppercase tracking-widest mt-1">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "---"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                      className="text-gray-200 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {isDeleting === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
