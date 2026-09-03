"use client";

import { Briefcase, ShoppingBag, Tag } from "lucide-react";
import type { AdCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: Array<{
  id: AdCategory;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "produto", label: "Produto", icon: <ShoppingBag className="h-4 w-4" /> },
  { id: "servico", label: "Serviço", icon: <Briefcase className="h-4 w-4" /> },
  { id: "promocao", label: "Promoção", icon: <Tag className="h-4 w-4" /> },
];

interface CategoryPillsProps {
  value: AdCategory;
  onChange: (value: AdCategory) => void;
}

export function CategoryPills({ value, onChange }: CategoryPillsProps) {
  return (
    <div>
      <p className="mb-2.5 text-sm font-medium text-foreground">
        O que você quer anunciar?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {categories.map((category) => {
          const selected = value === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-2.5 text-xs font-medium",
                selected && "option-selected border-transparent text-accent-purple",
              )}
            >
              <span className={selected ? "text-accent-purple" : "text-pink-500"}>
                {category.icon}
              </span>
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
