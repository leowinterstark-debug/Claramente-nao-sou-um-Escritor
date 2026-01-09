import { Link, useLocation } from "wouter";
import logoLettering from "@assets/generated_images/urban_lettering_logo_claramente.png";

export function Header() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin") || location.startsWith("/login");

  return (
    <header className={`w-full px-4 flex justify-center relative transition-all duration-500 ${isAdmin ? 'py-6 border-b border-gray-50' : 'py-12 md:py-20'}`}>
      <Link href={isAdmin ? "/admin" : "/"} className={`hover-elevate transition-all duration-500 flex justify-center ${isAdmin ? 'w-32 md:w-40' : 'w-[70vw] md:w-auto'}`}>
        <img 
          src={logoLettering} 
          alt="Claramente Não Sou um Escritor" 
          className={`object-contain transition-all duration-500 ${isAdmin ? 'h-12' : 'w-full md:h-96'}`}
        />
      </Link>
      
      {/* Hidden red dot login link - Small, random-looking but functional */}
      {!isAdmin && (
        <Link 
          href="/login" 
          className="fixed w-1.5 h-1.5 bg-red-600 rounded-full opacity-10 hover:opacity-100 transition-opacity z-50 cursor-default"
          style={ {
            top: '18.4%',
            right: '7.2%'
          } }
          title="."
        >
          <span className="sr-only">Admin Login</span>
        </Link>
      )}
    </header>
  );
}
