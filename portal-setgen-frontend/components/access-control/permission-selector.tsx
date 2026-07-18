"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { PermissionGroup } from "@/lib/api/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PermissionSelectorProps {
  availablePermissions: PermissionGroup[];
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  /** Permissions already granted via the user's role: shown checked, cannot be toggled off here. */
  lockedPermissions?: string[];
}

export function PermissionSelector({
  availablePermissions,
  selectedPermissions,
  onChange,
  disabled = false,
  lockedPermissions = [],
}: PermissionSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const togglePermission = (permId: string) => {
    if (disabled || lockedPermissions.includes(permId)) return;
    const newPermissions = selectedPermissions.includes(permId)
      ? selectedPermissions.filter((id) => id !== permId)
      : [...selectedPermissions, permId];
    onChange(newPermissions);
  };

  const toggleAllInGroup = (group: PermissionGroup) => {
    if (disabled) return;
    const allIds = group.permissions.map((p) => p.id);
    const toggleableIds = allIds.filter((id) => !lockedPermissions.includes(id));
    const allSelected = allIds.every((id) => selectedPermissions.includes(id));

    let newPermissions = [...selectedPermissions];
    if (allSelected) {
      newPermissions = newPermissions.filter((id) => !toggleableIds.includes(id));
    } else {
      const toAdd = toggleableIds.filter((id) => !selectedPermissions.includes(id));
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
          <div key={group.name} className="border border-border rounded-lg overflow-hidden bg-card">
            <div 
              className="flex items-center justify-between p-3 bg-muted cursor-pointer hover:bg-muted transition-colors"
              onClick={() => toggleGroup(group.name)}
            >
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <span className="font-semibold text-foreground">{group.name}</span>
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
                  className="text-xs text-muted-foreground hover:text-orange-600 h-7"
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
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border">
                {group.permissions.map((perm) => {
                  const isSelected = selectedPermissions.includes(perm.id);
                  const isLocked = lockedPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      className={`flex items-start gap-3 p-3 rounded-md border transition-all ${
                        isLocked ? "cursor-not-allowed" : "cursor-pointer"
                      } ${
                        isSelected
                          ? isLocked
                            ? "bg-muted border-border"
                            : "bg-orange-50 border-orange-200"
                          : "bg-card border-border hover:border-border"
                      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                      onClick={() => togglePermission(perm.id)}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? isLocked
                              ? "bg-muted-foreground border-muted-foreground text-white"
                              : "bg-orange-600 border-orange-600 text-white"
                            : "bg-card border-border"
                        }`}
                      >
                        {isSelected && (isLocked ? <Lock className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isSelected && !isLocked ? "text-orange-900" : "text-foreground"}`}>
                            {perm.label}
                          </p>
                          {isLocked && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-none bg-muted text-muted-foreground">
                              Via cargo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
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
