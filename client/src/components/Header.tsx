import { Link, useLocation } from "wouter";

export function Header() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin") || location.startsWith("/login");

  if (isAdmin) return null;

  return (
    <header className="w-full py-20 px-4 flex justify-center">
      <h1 className="text-2xl md:text-4xl font-serif text-center tracking-tight text-black selection:bg-black selection:text-white">
        Claramente Não Sou um Escrito
        <Link href="/login" className="hover:cursor-help transition-colors">
          r
        </Link>
      </h1>
    </header>
  );
}
