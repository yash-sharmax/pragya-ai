"use client";

import React, { useState } from "react";
import { PersonaId, PERSONAS } from "@/lib/personas";
import { Compass, Briefcase, Calculator, Heart, ChevronDown, Check, Sparkles } from "lucide-react";

interface PersonaSelectorProps {
  activePersona: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
}

export function PersonaSelector({ activePersona, onSelectPersona }: PersonaSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = PERSONAS[activePersona] || PERSONAS.veda;

  const getIcon = (id: PersonaId) => {
    switch (id) {
      case "veda":
        return <Compass className="w-4 h-4 text-blue-500" />;
      case "neeti":
        return <Briefcase className="w-4 h-4 text-emerald-500" />;
      case "ganita":
        return <Calculator className="w-4 h-4 text-violet-500" />;
      case "sarathi":
        return <Heart className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-amber-400/60 dark:hover:border-amber-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all active:scale-[0.99]"
      >
        <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          {getIcon(activePersona)}
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-semibold text-slate-900 dark:text-white">{current.name}</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">({current.sanskritName})</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 hidden sm:inline">
            {current.tagline}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 origin-top-left rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 focus:outline-none ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Specialized IKS Personas</span>
              </span>
            </div>
            <div className="space-y-1">
              {(Object.keys(PERSONAS) as PersonaId[]).map((id) => {
                const p = PERSONAS[id];
                const isSelected = id === activePersona;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      onSelectPersona(id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all text-xs ${
                      isSelected
                        ? "bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 font-medium"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="mt-0.5 p-1 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                      {getIcon(id)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.sanskritName})
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {p.domain}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/40 font-medium">
                          {p.tagline}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
