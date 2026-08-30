"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Apenas rotas autenticadas internas (pós-login) suportam o modo claro
  // Todas as rotas públicas ou de login (ex: /, /login, /admin/login, /faq, /tutorial) permanecem sempre em Dark Mode
  const isAuthArea = 
    (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) && 
    pathname !== "/admin/login" &&
    pathname !== "/login";

  useEffect(() => {
    const stored = localStorage.getItem("susanoo-theme") as Theme | null;
    const initial = stored ?? "dark";
    setTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAuthArea) {
      // Aplica a preferência do usuário nas páginas internas pós-login
      document.documentElement.classList.toggle("dark", theme === "dark");
    } else {
      // Força modo escuro cinematográfico em todas as telas pré-login (Início, Login, FAQ, Tutorial, etc.)
      document.documentElement.classList.add("dark");
    }
  }, [theme, pathname, isAuthArea, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("susanoo-theme", next);
      if (isAuthArea) {
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
