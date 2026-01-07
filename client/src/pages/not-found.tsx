import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-black p-4">
      <h1 className="font-serif text-6xl mb-4">404</h1>
      <p className="font-serif text-xl text-gray-500 mb-8 italic">
        "O que você procura não está aqui, ou talvez nunca tenha existido."
      </p>

      <Link href="/" className="border-b border-black pb-1 font-sans text-sm uppercase tracking-widest hover:text-gray-500 hover:border-gray-500 transition-colors">
        Voltar ao início
      </Link>
    </div>
  );
}
