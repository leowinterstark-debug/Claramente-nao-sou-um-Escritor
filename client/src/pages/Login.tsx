import { useState } from "react";
import { useLogin } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    login(password, {
      onSuccess: () => setLocation("/admin"),
      onError: (err) => setError(err.message),
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-serif text-center mb-12">Acesso Restrito</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full border-b border-gray-200 py-2 text-center font-serif text-lg focus:outline-none focus:border-black transition-colors placeholder:text-gray-200"
              autoFocus
            />
            {error && (
              <p className="text-center text-xs text-red-400 font-sans mt-2">{error}</p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isPending || !password}
              className="px-8 py-2 bg-black text-white font-sans text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
