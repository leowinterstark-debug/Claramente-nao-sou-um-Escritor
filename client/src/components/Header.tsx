import { Link, useLocation } from "wouter";
import logoLettering from "@assets/generated_images/lettering_logo_for_blog.png";

export function Header() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin") || location.startsWith("/login");

  if (isAdmin) return null;

  return (
    <header className="w-full py-20 px-4 flex justify-center">
      <Link href="/" className="hover-elevate transition-transform duration-300">
        <img 
          src={logoLettering} 
          alt="Claramente Não Sou um Escritor" 
          className="h-24 md:h-32 object-contain"
        />
      </Link>
      <Link href="/login" className="absolute top-0 right-0 opacity-0 h-10 w-10 cursor-help">
        Admin
      </Link>
    </header>
  );
}
