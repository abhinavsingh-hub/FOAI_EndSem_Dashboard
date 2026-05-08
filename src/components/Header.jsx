import React from 'react';
import { Moon, Sun, Satellite } from 'lucide-react';

export default function Header({ darkMode, setDarkMode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Satellite className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Orbital<span className="text-blue-500">Dash</span>
          </span>
        </div>
        
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
