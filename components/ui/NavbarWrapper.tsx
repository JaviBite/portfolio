"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

export function NavbarWrapper() {
  const pathname = usePathname();
  const isPrintPage = pathname?.startsWith("/cv/print");

  if (isPrintPage) {
    return null;
  }

  return <Navbar />;
}
