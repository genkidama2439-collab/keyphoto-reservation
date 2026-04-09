"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1628]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-center px-4">
        <Link href="/" className="text-xl font-bold tracking-wider text-[#c9a84c]">
          KeyPhoto
        </Link>
      </div>
    </header>
  );
}
