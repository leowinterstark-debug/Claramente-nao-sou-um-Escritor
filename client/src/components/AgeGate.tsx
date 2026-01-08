import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import logoLettering from "@assets/generated_images/urban_lettering_logo_claramente.png";

export function AgeGate() {
  const [isVisible, setIsVisible] = useState(false); // Default false to prevent flash
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Check cookie on mount
    const verified = Cookies.get("age-verified");
    if (!verified) {
      setIsVisible(true);
    }
    setHasChecked(true);
  }, []);

  const handleVerify = () => {
    Cookies.set("age-verified", "true", { expires: 365 });
    setIsVisible(false);
  };

  if (!hasChecked) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-black p-4"
        >
          <div className="max-w-md w-full text-center space-y-12 flex flex-col items-center">
            <img 
              src={logoLettering} 
              alt="Claramente Não Sou um Escritor" 
              className="w-[70vw] md:w-[40vw] lg:w-[30vw] object-contain"
            />
            
            <div className="space-y-6">
              <p className="font-sans text-sm text-gray-500 uppercase tracking-widest">
                Conteúdo Sensível
              </p>
              
              <button
                onClick={handleVerify}
                className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-sans font-medium tracking-tighter text-black transition duration-300 ease-out border border-black hover:bg-black hover:text-white"
              >
                <span className="absolute inset-0 w-full h-full bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative">Tenho mais de 18 anos</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
