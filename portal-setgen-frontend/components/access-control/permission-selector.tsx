"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { PermissionGroup } from "@/lib/api/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PermissionSelectorProps {
  availablePermissions: PermissionGroup[];
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function PermissionSelector({
  availablePermissions,
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const togglePermission = (permId: string) => {
    if (disabled) return;
    const newPermissions = selectedPermissions.includes(permId)
      ? selectedPermissions.filter((id) => id !== permId)
      : [...selectedPermissions, permId];
    onChange(newPermissions);
  };

  const toggleAllInGroup = (group: PermissionGroup) => {
    if (disabled) return;
    const allIds = group.permissions.map((p) => p.id);
    const allSelected = allIds.every((id) => selectedPermissions.includes(id));

    let newPermissions = [...selectedPermissions];
    if (allSelected) {
      newPermissions = newPermissions.filter((id) => !allIds.includes(id));
    } else {
      const toAdd = allIds.filter((id) => !selectedPermissions.includes(id));
      newPermissions = [...newPermissions, ...toAdd];
    }
    onChange(newPermissions);
  };

  return (
    <div className="space-y-4">
      {availablePermissions.map((group) => {
        const groupPermissionIds = group.permissions.map((p) => p.id);
        const selectedCount = groupPermissionIds.filter((id) => selectedPermissions.includes(id)).length;
        const isAllSelected = selectedCount === groupPermissionIds.length;
        const isExpanded = expandedGroups[group.name];

        return (
          <div key={group.name} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div 
              className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleGroup(group.name)}
            >
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <span className="font-semibold text-gray-700">{group.name}</span>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">
                    {selectedCount} / {groupPermissionIds.length}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-orange-600 h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAllInGroup(group);
                  }}
                  disabled={disabled}
                >
                  {isAllSelected ? "Desmarcar Todos" : "Marcar Todos"}
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100">
                {group.permissions.map((perm) => {
                  const isSelected = selectedPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      className={`flex items-start gap-3 p-3 rounded-md cursor-pointer border transition-all ${
                        isSelected
                          ? "bg-orange-50 border-orange-200"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                      onClick={() => togglePermission(perm.id)}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-orange-600 border-orange-600 text-white"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? "text-orange-900" : "text-gray-700"}`}>
                          {perm.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
