import { useState, useEffect, useRef } from "react";
import { useCreatePost, usePosts } from "@/hooks/use-posts";
import { useAuthCheck, useLogout } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Loader2, LogOut, Trash2, ChevronLeft, Mic, Square } from "lucide-react";
import aiMachineIcon from "@/assets/ai-machine.png";
import logoAdmin from "@/assets/logo-admin.png";
import micIcon from "@/assets/mic-icon.png";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Protected route logic
  useEffect(() => {
    if (!authLoading && !auth?.isAuthenticated) {
      setLocation("/login");
    }
  }, [auth, authLoading, setLocation]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Falha na transcrição");
      const data = await res.json();
      setContent(prev => prev ? `${prev}\n\n${data.text}` : data.text);
      toast({
        title: "Áudio transcrito",
        description: "O texto foi adicionado à sua crônica.",
      });
    } catch (err) {
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível transcrever o áudio.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSuggest = async () => {
    if (!content && !title) return;
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title, coverImageUrl }),
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
              <div className="flex items-center gap-6">
                <Link href="/" className="text-gray-300 hover:text-black transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <img src={logoAdmin} alt="Claramente Não Sou um Escritor" className="h-20 w-auto object-contain" />
              </div>
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

              <div className="relative border-l border-gray-50 pl-6 group">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Comece a escrever..."
                  className="w-full min-h-[30vh] text-lg font-serif leading-relaxed placeholder:text-gray-100 border-none focus:ring-0 p-0 bg-transparent resize-none"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className="transition-all duration-300 transform hover:scale-110 active:scale-95 disabled:grayscale"
                    title={isRecording ? "Parar gravação" : "Gravar áudio com Jarbas"}
                  >
                    <div className="relative">
                      <img 
                        src={micIcon} 
                        alt="Gravar" 
                        className={`w-10 h-10 md:w-12 md:h-12 object-contain transition-all ${isRecording ? 'animate-pulse scale-110' : isTranscribing ? 'animate-spin grayscale opacity-50' : 'opacity-30 group-hover:opacity-100'}`} 
                      />
                      {isTranscribing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                      )}
                      {isRecording && (
                        <div className="absolute -top-1 -right-1">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleSuggest}
                    disabled={isSuggesting}
                    className="transition-all duration-300 transform hover:scale-110 active:scale-95 disabled:grayscale"
                    title={content.trim() ? "Ajustar crônica com Jarbas" : "Criar crônica a partir da imagem com Jarbas"}
                  >
                    <div className="relative">
                      <img 
                        src={aiMachineIcon} 
                        alt="Jarbas AI" 
                        className={`w-10 h-10 md:w-12 md:h-12 object-contain transition-all ${isSuggesting ? 'animate-pulse brightness-110' : 'opacity-30 group-hover:opacity-100 hover:drop-shadow-sm'}`} 
                      />
                      {isSuggesting && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
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
