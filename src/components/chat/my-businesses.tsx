"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

// Businesses you set up are private: nobody else sees them listed.
// This browser remembers the ones you made so you can find them again.
const KEY = "reppy.myBusinesses";
type Mine = { slug: string; name: string; type: string };

export function rememberBusiness(b: Mine) {
  try {
    const list: Mine[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    localStorage.setItem(KEY, JSON.stringify([b, ...list.filter((x) => x.slug !== b.slug)].slice(0, 20)));
  } catch {
    // storage unavailable (private mode): the link still works
  }
}

export function MyBusinesses() {
  const [list, setList] = useState<Mine[] | null>(null);
  useEffect(() => {
    try {
      setList(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      setList([]);
    }
  }, []);
  if (list === null) return <div className="h-20" />;
  if (list.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong p-6 text-[14px] text-fg-3">
        None yet. Set one up from a rate card photo or a few lines of notes; it takes about a minute. Your businesses stay private: only people with the link can chat with them.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
      {list.map((b) => (
        <li key={b.slug}>
          <Link href={`/chat/${b.slug}`} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02]">
            <span>
              <span className="block text-[15px] font-medium">{b.name}</span>
              <span className="text-[12.5px] text-fg-3">{b.type} · private link</span>
            </span>
            <span className="text-[13px] text-violet-300">Chat</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
