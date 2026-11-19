import { useState, useRef, useEffect, useMemo } from "react";
import {
  LuUsers,
  LuBookOpen,
  LuGraduationCap,
  LuClipboardList,
  LuTarget,
  LuChartBar as LuBarChart3,
  LuShield,
  LuChevronDown,
  LuChevronRight,
  LuSearch,
  LuRotateCcw,
  LuSparkles,
} from "react-icons/lu";
import {
  PERMISSION_MODULES,
  PERMISSION_PRESETS,
  getAllPermissionKeys,
} from "../../data/permissionsData";

// Icon mapping สำหรับโมดูลสิทธิ์
const MODULE_ICONS = {
  users: LuUsers,
  courses: LuBookOpen,
  lessons: LuGraduationCap,
  quizzes: LuClipboardList,
  missions: LuTarget,
  reports: LuBarChart3,
  security: LuShield,
};

/**
 * TriStateCheckbox Component
 * Renders native checkbox with true indeterminate horizontal dash state
 */
function TriStateCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled = false,
  id,
  className = "",
  ariaLabel,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      id={id}
      ref={ref}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={ariaLabel}
      className={`h-4.5 w-4.5 rounded-[6px] border-[#CBD5E1] text-[#004643] accent-[#004643] focus:ring-2 focus:ring-[#ABD1C6]/50 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

/**
 * Dynamic Permission Matrix Component
 *
 * Props:
 * - selectedPermissions: string[] (array of active permission keys like "users.view")
 * - onChange: (newPermissions: string[]) => void
 * - readOnly: boolean (if true, disable editing)
 * - rolePermissions: string[] | null (optional: base permissions from role when editing a specific staff)
 * - isUserOverrideMode: boolean (indicates whether we are editing staff individual overrides)
 * - onResetToRole: () => void (optional callback to reset overrides back to role)
 */
export default function PermissionMatrix({
  selectedPermissions = [],
  onChange,
  readOnly = false,
  rolePermissions = null,
  isUserOverrideMode = false,
  onResetToRole,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  // เปิด Accordion ทุกโมดูลเป็นค่าเริ่มต้นเพื่อให้ผู้ดูแลระบบตรวจสอบได้ง่าย
  const [expandedModules, setExpandedModules] = useState(() => {
    const init = {};
    PERMISSION_MODULES.forEach((m) => {
      init[m.id] = true;
    });
    return init;
  });

  const allKeys = useMemo(() => getAllPermissionKeys(), []);
  const selectedSet = useMemo(
    () => new Set(selectedPermissions),
    [selectedPermissions]
  );
  const roleSet = useMemo(
    () => (rolePermissions ? new Set(rolePermissions) : null),
    [rolePermissions]
  );

  // Toggle module expand/collapse
  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const expandAll = () => {
    const next = {};
    PERMISSION_MODULES.forEach((m) => {
      next[m.id] = true;
    });
    setExpandedModules(next);
  };

  const collapseAll = () => {
    setExpandedModules({});
  };

  // Toggle single action permission
  const handleToggleAction = (permKey) => {
    if (readOnly) return;
    const next = new Set(selectedPermissions);
    if (next.has(permKey)) {
      next.delete(permKey);
    } else {
      next.add(permKey);
    }
    onChange?.(Array.from(next));
  };

  // Toggle whole module
  const handleToggleModule = (moduleObj) => {
    if (readOnly) return;
    const moduleKeys = moduleObj.actions.map((act) => `${moduleObj.id}.${act.id}`);
    const areAllSelected = moduleKeys.every((k) => selectedSet.has(k));

    const next = new Set(selectedPermissions);
    if (areAllSelected) {
      // Uncheck all in this module
      moduleKeys.forEach((k) => next.delete(k));
    } else {
      // Check all in this module
      moduleKeys.forEach((k) => next.add(k));
    }
    onChange?.(Array.from(next));
  };

  // Select All in entire matrix
  const handleSelectAll = () => {
    if (readOnly) return;
    onChange?.(allKeys);
  };

  // Deselect All in entire matrix
  const handleDeselectAll = () => {
    if (readOnly) return;
    onChange?.([]);
  };

  // Apply Preset
  const handleApplyPreset = (preset) => {
    if (readOnly) return;
    const keys = preset.getPermissions();
    onChange?.(keys);
  };

  // Filter modules and actions based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return PERMISSION_MODULES;
    const query = searchQuery.toLowerCase().trim();

    return PERMISSION_MODULES.map((mod) => {
      const matchModule =
        mod.title.toLowerCase().includes(query) ||
        mod.description.toLowerCase().includes(query);

      const matchingActions = mod.actions.filter(
        (act) =>
          act.label.toLowerCase().includes(query) ||
          act.description.toLowerCase().includes(query) ||
          act.id.toLowerCase().includes(query)
      );

      if (matchModule) {
        return mod;
      }

      if (matchingActions.length > 0) {
        return {
          ...mod,
          actions: matchingActions,
        };
      }

      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Action Bar: Search, Presets & Global Select */}
      <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs space-y-4">
        {/* Row 1: Search and Global Quick Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <LuSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7773]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาสิทธิ์ เช่น ดูผู้ใช้งาน, เผยแพร่คอร์ส, export..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-10 pr-4 py-2 text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B7773] hover:text-[#26332F]"
              >
                ล้าง
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1.5 rounded-lg border border-[#E5E9E7] bg-white text-xs font-semibold text-[#26332F] hover:bg-[#ABD1C6]/15 transition"
            >
              ขยายทั้งหมด
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1.5 rounded-lg border border-[#E5E9E7] bg-white text-xs font-semibold text-[#26332F] hover:bg-[#ABD1C6]/15 transition"
            >
              ย่อทั้งหมด
            </button>

            {!readOnly && (
              <>
                <div className="h-4 w-px bg-[#E5E9E7] mx-1" />
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-lg bg-[#ABD1C6] text-xs font-bold text-[#004643] hover:bg-[#97c4b7] transition cursor-pointer"
                >
                  เลือกทั้งหมด ({allKeys.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E9E7] bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  ยกเลิกทั้งหมด
                </button>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Presets (Only when not in readOnly mode) */}
        {!readOnly && (
          <div className="pt-3 border-t border-[#E5E9E7]/70">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#26332F] mr-1">
                <LuSparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                <span>แม่แบบสิทธิ์ (Presets):</span>
              </div>
              {PERMISSION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  title={preset.description}
                  className="px-2.5 py-1 rounded-lg border border-[#E5E9E7] bg-[#FAFAFA] text-xs font-medium text-[#26332F] hover:border-[#ABD1C6] hover:bg-[#ABD1C6]/20 transition cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}

              {isUserOverrideMode && onResetToRole && (
                <button
                  type="button"
                  onClick={onResetToRole}
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                >
                  <LuRotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>รีเซ็ตตามบทบาท</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected count badge banner */}
        <div className="flex items-center justify-between text-xs text-[#6B7773] bg-[#FAFAFA] px-3.5 py-2 rounded-xl border border-[#E5E9E7]">
          <span>
            เลือกแล้ว{" "}
            <strong className="text-[#004643] font-bold text-sm">
              {selectedPermissions.length}
            </strong>{" "}
            จากทั้งหมด {allKeys.length} สิทธิ์
          </span>
          {isUserOverrideMode && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
              กำลังอยู่ในโหมดปรับสิทธิ์เฉพาะบุคคล
            </span>
          )}
        </div>
      </div>

      {/* Accordion Modules List */}
      <div className="space-y-3">
        {filteredModules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-xs text-[#6B7773]">
            ไม่พบสิทธิ์ที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredModules.map((mod) => {
            const IconComponent = MODULE_ICONS[mod.id] || LuUsers;
            const moduleActionKeys = mod.actions.map(
              (act) => `${mod.id}.${act.id}`
            );
            const selectedInModule = moduleActionKeys.filter((k) =>
              selectedSet.has(k)
            ).length;
            const totalInModule = moduleActionKeys.length;

            const isAllChecked =
              totalInModule > 0 && selectedInModule === totalInModule;
            const isIndeterminate =
              selectedInModule > 0 && selectedInModule < totalInModule;
            const isExpanded = Boolean(expandedModules[mod.id]);

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-[#E5E9E7] bg-white overflow-hidden shadow-2xs transition hover:border-[#ABD1C6]/70"
              >
                {/* Module Header (Click to toggle accordion) */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-white select-none border-b border-transparent">
                  {/* Left: Checkbox + Icon + Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <TriStateCheckbox
                      id={`mod-check-${mod.id}`}
                      checked={isAllChecked}
                      indeterminate={isIndeterminate}
                      onChange={() => handleToggleModule(mod)}
                      disabled={readOnly}
                      ariaLabel={`เลือกสิทธิ์ทั้งหมดในหมวด ${mod.title}`}
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleModule(mod.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleModule(mod.id);
                        }
                      }}
                      className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/25 text-[#004643]">
                        <IconComponent className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#26332F]">
                            {mod.title}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isAllChecked
                                ? "bg-emerald-100 text-emerald-800"
                                : selectedInModule > 0
                                ? "bg-[#ABD1C6]/40 text-[#004643]"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {selectedInModule}/{totalInModule}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7773] hidden sm:block">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick toggle + Expand arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleToggleModule(mod)}
                        className="text-xs text-[#004643] hover:underline font-semibold px-2 py-1"
                      >
                        {isAllChecked ? "ยกเลิกหมวดนี้" : "เลือกหมวดนี้"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.id)}
                      className="p-1 rounded-lg text-[#6B7773] hover:text-[#26332F] hover:bg-[#FAFAFA]"
                      aria-label={isExpanded ? "ย่อส่วนนี้" : "ขยายส่วนนี้"}
                    >
                      {isExpanded ? (
                        <LuChevronDown className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <LuChevronRight className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Module Body: Action Checkbox Grid */}
                {isExpanded && (
                  <div className="border-t border-[#E5E9E7] bg-[#FAFAFA]/50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {mod.actions.map((act) => {
                        const permKey = `${mod.id}.${act.id}`;
                        const isChecked = selectedSet.has(permKey);

                        // User Override Status calculations
                        const hasRolePermission = roleSet
                          ? roleSet.has(permKey)
                          : false;
                        const isAddedOverride =
                          isUserOverrideMode && !hasRolePermission && isChecked;
                        const isRevokedOverride =
                          isUserOverrideMode && hasRolePermission && !isChecked;
                        const isInheritedRole =
                          isUserOverrideMode && hasRolePermission && isChecked;

                        return (
                          <label
                            key={act.id}
                            htmlFor={`act-${mod.id}-${act.id}`}
                            className={`flex items-start gap-3 rounded-xl border p-3 transition cursor-pointer ${
                              isChecked
                                ? "border-[#ABD1C6] bg-white shadow-2xs"
                                : "border-[#E5E9E7] bg-white hover:border-[#CBD5E1]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              id={`act-${mod.id}-${act.id}`}
                              checked={isChecked}
                              disabled={readOnly}
                              onChange={() => handleToggleAction(permKey)}
                              className="mt-0.5 h-4 w-4 rounded-[5px] border-[#CBD5E1] text-[#004643] accent-[#004643] focus:ring-2 focus:ring-[#ABD1C6]/50 cursor-pointer disabled:cursor-not-allowed"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="text-xs sm:text-sm font-semibold text-[#26332F]">
                                  {act.label}
                                </span>

                                {/* Badges for Override mode */}
                                {isUserOverrideMode && (
                                  <>
                                    {isAddedOverride && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                        + สิทธิ์พิเศษเฉพาะบุคคล
                                      </span>
                                    )}
                                    {isRevokedOverride && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                        - ระงับเฉพาะบุคคล
                                      </span>
                                    )}
                                    {isInheritedRole && (
                                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        จากบทบาท
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <p className="text-[11px] text-[#6B7773] mt-0.5 leading-snug">
                                {act.description}
                              </p>
                              <span className="text-[10px] font-mono text-[#6B7773]/70">
                                {permKey}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
