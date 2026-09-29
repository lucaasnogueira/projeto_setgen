"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, X, ChevronDown, Layers, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkspaceTab {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: string | number;
  closable?: boolean;
  content: React.ReactNode;
}

export interface AvailableFormOption {
  key: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  createComponent: (props: { close: () => void; tabId: string }) => React.ReactNode;
}

interface MultiCrudWorkspaceProps {
  defaultTab: WorkspaceTab;
  availableForms?: AvailableFormOption[];
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function MultiCrudWorkspace({
  defaultTab,
  availableForms = [],
  onTabChange,
  className,
}: MultiCrudWorkspaceProps) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([defaultTab]);
  const [activeTabId, setActiveTabId] = useState<string>(defaultTab.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const formCounterRef = useRef<number>(1);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectTab = (id: string) => {
    setActiveTabId(id);
    onTabChange?.(id);
  };

  const closeTab = (tabIdToClose: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabIdToClose);
      if (activeTabId === tabIdToClose) {
        const nextActive = filtered[filtered.length - 1]?.id || defaultTab.id;
        setActiveTabId(nextActive);
        onTabChange?.(nextActive);
      }
      return filtered;
    });
  };

  const handleOpenForm = (option: AvailableFormOption) => {
    setMenuOpen(false);
    const instanceNumber = formCounterRef.current++;
    const newTabId = `form-${option.key}-${instanceNumber}`;
    const newTitle = `${option.label} #${instanceNumber}`;

    const newTab: WorkspaceTab = {
      id: newTabId,
      title: newTitle,
      icon: option.icon,
      closable: true,
      content: option.createComponent({
        close: () => closeTab(newTabId),
        tabId: newTabId,
      }),
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);
    onTabChange?.(newTabId);
  };

  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden bg-[#FAFAFB]", className)}>
      {/* 1. BARRA DE ABAS MINIMALISTA (WORKSPACE TABS + BOTÃO [+]) */}
      <div className="h-10 bg-white border-b border-gray-200 px-3 flex items-center justify-between shrink-0 select-none">
        
        {/* Abas com Underline Limpo */}
        <div className="flex items-center gap-1 h-full overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const TabIcon = tab.icon || Layers;

            return (
              <div
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "h-full px-3 text-xs flex items-center gap-2 shrink-0 cursor-pointer transition-all border-b-2",
                  isActive
                    ? "border-orange-600 text-gray-900 font-semibold bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                )}
              >
                <TabIcon
                  className={cn(
                    "w-3.5 h-3.5 shrink-0",
                    isActive ? "text-orange-600" : "text-gray-400"
                  )}
                />
                <span className="truncate max-w-[160px]">{tab.title}</span>

                {/* Badge opcional de contagem */}
                {tab.badge !== undefined && (
                  <span className="text-[10px] text-gray-400 font-mono ml-0.5">
                    {tab.badge}
                  </span>
                )}

                {/* Botão de Fechar Aba */}
                {tab.closable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    title="Fechar Aba"
                    className="w-3.5 h-3.5 rounded hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 ml-1 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTÃO [+] MINIMALISTA */}
        {availableForms.length > 0 && (
          <div className="relative ml-2 shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title="Adicionar formulário em nova aba"
              className={cn(
                "w-7 h-7 rounded-md border border-dashed text-xs flex items-center justify-center transition-colors",
                menuOpen
                  ? "bg-gray-100 border-gray-400 text-gray-900"
                  : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu Minimalista */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Novo Formulário
                </div>
                {availableForms.map((option) => {
                  const OptionIcon = option.icon || Plus;
                  return (
                    <button
                      key={option.key}
                      onClick={() => handleOpenForm(option)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2.5 transition-colors group text-gray-700 hover:text-gray-900"
                    >
                      <OptionIcon className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-[10px] text-gray-400 truncate">
                            {option.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. ÁREA DE CONTEÚDO */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-[#FAFAFB]">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn("h-full", tab.id === activeTabId ? "block" : "hidden")}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

