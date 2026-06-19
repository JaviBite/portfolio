"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Locale = "es" | "en";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Record<string, any>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [messages, setMessages] = useState<Record<string, any>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = document.cookie.match(/locale=([^;]+)/)?.[1] as Locale | undefined;
    if (saved) {
      setLocaleState(saved);
      loadMessages(saved);
    } else {
      loadMessages("es");
    }
  }, []);

  const loadMessages = async (newLocale: Locale) => {
    try {
      const data = await import(`../messages/${newLocale}.json`);
      setMessages(data.default);
    } catch (error) {
      console.error(`Failed to load messages for locale: ${newLocale}`, error);
    }
  };

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    await loadMessages(newLocale);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    // If there is no provider (e.g. during first render of some client pages),
    // try to read the locale cookie synchronously so pages like `/cv/print`
    // can pick up the currently selected language instead of always falling back to "es".
    if (typeof document !== "undefined") {
      const saved = document.cookie.match(/locale=([^;]+)/)?.[1] as Locale | undefined;
      return {
        locale: (saved as Locale) || ("es" as const),
        setLocale: () => {},
        messages: {},
      };
    }

    return {
      locale: "es" as const,
      setLocale: () => {},
      messages: {},
    };
  }
  return context;
}
