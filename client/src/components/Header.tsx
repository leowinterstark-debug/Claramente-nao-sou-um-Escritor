import { Link } from "wouter";
import logoLettering from "@assets/generated_images/urban_lettering_logo_claramente.png";

export function Header() {
  return (
    <header className="w-full py-12 md:py-20 px-4 flex justify-center relative">
      <Link href="/admin" className="hover-elevate transition-transform duration-300 w-[70vw] md:w-auto flex justify-center">
        <img 
          src={logoLettering} 
          alt="Claramente Não Sou um Escritor" 
          className="w-full md:h-48 object-contain"
        />
      </Link>
      
      {/* Hidden red dot login link - Small, random-looking but functional */}
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
    </header>
  );
}
