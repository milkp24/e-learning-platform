import React from "react";
import {
  LuPlus,
  LuTrash2,
  LuPencil as LuEdit3,
  LuCode,
  LuBug,
  LuTarget,
} from "react-icons/lu";

/**
 * ExerciseActivitiesTab Component
 * Presentational and controlled component for managing interactive exercise activities
 * Types: fill_code, debug_code, mission
 * Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 */
function ExerciseActivitiesTab({
  activities = [],
  editingActivityItem,
  setEditingActivityItem,
  onSaveItem,
  onDeleteItem,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#26332F]">
          กิจกรรมเชิงโต้ตอบ (Fill Code, Debug Code, Mission)
        </h3>
        <button
          type="button"
          onClick={() =>
            setEditingActivityItem({
              type: "fill_code",
              title: "",
              instruction: "",
              score: 25,
              language: "javascript",
              code_template: "",
              correct_answer: "",
              initial_code: "",
              expected_output: "",
              correct_code: "",
              hint: "",
              explanation: "",
              order: activities.length + 1,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#ABD1C6] px-3.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-[#9cc4b9] transition cursor-pointer"
        >
          <LuPlus className="h-4 w-4" />
          <span>เพิ่มกิจกรรมใหม่</span>
        </button>
      </div>

      {/* Form for Editing or Creating Activity */}
      {editingActivityItem && (
        <div className="rounded-2xl border-2 border-[#ABD1C6] bg-white p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-[#004643] border-b border-[#E5E9E7] pb-2">
            {editingActivityItem.index !== undefined ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-[#26332F]">ประเภทกิจกรรม</label>
              <select
                value={editingActivityItem.type}
                onChange={(e) =>
                  setEditingActivityItem({ ...editingActivityItem, type: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2"
              >
                <option value="fill_code">Fill Code (เติมโค้ดในช่องว่าง)</option>
                <option value="debug_code">Debug Code (แก้ไขจุดบกพร่อง)</option>
                <option value="mission">Mission (ภารกิจท้าทาย)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#26332F]">ชื่อกิจกรรม (Title) *</label>
              <input
                type="text"
                value={editingActivityItem.title || ""}
                onChange={(e) =>
                  setEditingActivityItem({ ...editingActivityItem, title: e.target.value })
                }
                placeholder="เช่น เติมชื่อตัวแปรให้ถูกต้อง"
                className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2"
              />
            </div>

            <div>
              <label className="font-bold text-[#26332F]">คะแนน (Score)</label>
              <input
                type="number"
                min="0"
                value={editingActivityItem.score || 0}
                onChange={(e) =>
                  setEditingActivityItem({
                    ...editingActivityItem,
                    score: Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="font-bold text-[#26332F]">คำสั่งและคำแนะนำ (Instruction)</label>
              <textarea
                rows={2}
                value={editingActivityItem.instruction || ""}
                onChange={(e) =>
                  setEditingActivityItem({
                    ...editingActivityItem,
                    instruction: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2"
              />
            </div>

            {/* Type-specific Fields */}
            {editingActivityItem.type === "fill_code" && (
              <>
                <div className="md:col-span-3">
                  <label className="font-bold text-[#26332F]">Code Template *</label>
                  <textarea
                    rows={3}
                    value={editingActivityItem.code_template || ""}
                    onChange={(e) =>
                      setEditingActivityItem({
                        ...editingActivityItem,
                        code_template: e.target.value,
                      })
                    }
                    placeholder="เช่น const sensor = new Sensor(___);"
                    className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2 font-mono text-xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="font-bold text-[#26332F]">เฉลยคำตอบที่ถูกต้อง (Correct Answer) *</label>
                  <input
                    type="text"
                    value={
                      Array.isArray(editingActivityItem.correct_answer)
                        ? editingActivityItem.correct_answer.join(", ")
                        : editingActivityItem.correct_answer || ""
                    }
                    onChange={(e) =>
                      setEditingActivityItem({
                        ...editingActivityItem,
                        correct_answer: e.target.value,
                      })
                    }
                    placeholder="เช่น 'DHT22'"
                    className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2 font-mono"
                  />
                </div>
              </>
            )}

            {editingActivityItem.type === "debug_code" && (
              <>
                <div className="md:col-span-3">
                  <label className="font-bold text-[#26332F]">โค้ดเริ่มต้นที่มี Bug (Initial Code) *</label>
                  <textarea
                    rows={4}
                    value={editingActivityItem.initial_code || ""}
                    onChange={(e) =>
                      setEditingActivityItem({
                        ...editingActivityItem,
                        initial_code: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2 font-mono text-xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="font-bold text-[#26332F]">โค้ดเฉลยที่ถูกต้อง (Correct Code)</label>
                  <textarea
                    rows={4}
                    value={editingActivityItem.correct_code || ""}
                    onChange={(e) =>
                      setEditingActivityItem({
                        ...editingActivityItem,
                        correct_code: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2 font-mono text-xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="font-bold text-[#26332F]">ผลลัพธ์ที่คาดหวัง (Expected Output)</label>
                  <input
                    type="text"
                    value={editingActivityItem.expected_output || ""}
                    onChange={(e) =>
                      setEditingActivityItem({
                        ...editingActivityItem,
                        expected_output: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2 font-mono"
                  />
                </div>
              </>
            )}

            {editingActivityItem.type === "mission" && (
              <>
                <div className="md:col-span-3">
                  <label className="font-bold text-[#26332F]">เป้าหมายภารกิจ (Goal)</label>
                  <input
                    type="text"
                    value={editingActivityItem.goal || ""}
                    onChange={(e) =>
                      setEditingActivityItem({
                        ...editingActivityItem,
                        goal: e.target.value,
                      })
                    }
                    placeholder="เช่น ติดตั้งเซนเซอร์และเชื่อมต่อกับแดชบอร์ดสำเร็จ"
                    className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2"
                  />
                </div>
              </>
            )}

            {/* Hint & Explanation */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#26332F]">คำใบ้ (Hint)</label>
                <input
                  type="text"
                  value={editingActivityItem.hint || ""}
                  onChange={(e) =>
                    setEditingActivityItem({
                      ...editingActivityItem,
                      hint: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2"
                />
              </div>

              <div>
                <label className="font-bold text-[#26332F]">คำอธิบายเฉลย (Explanation)</label>
                <input
                  type="text"
                  value={editingActivityItem.explanation || ""}
                  onChange={(e) =>
                    setEditingActivityItem({
                      ...editingActivityItem,
                      explanation: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-[#E5E9E7] bg-white p-2"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={() => setEditingActivityItem(null)}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:text-[#26332F]"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => onSaveItem(editingActivityItem)}
              className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-[#9cc4b9]"
            >
              บันทึกกิจกรรมนี้
            </button>
          </div>
        </div>
      )}

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E9E7] bg-white p-8 text-center text-[#6B7773] text-xs">
          ยังไม่มีกิจกรรมในแบบฝึกหัดนี้ คลิก &quot;เพิ่มกิจกรรมใหม่&quot; เพื่อเริ่มต้น
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-center justify-between p-4 rounded-2xl border border-[#E5E9E7] bg-white hover:border-[#ABD1C6] transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643] shrink-0">
                  {item.type === "debug_code" ? (
                    <LuBug className="h-4 w-4" />
                  ) : item.type === "mission" ? (
                    <LuTarget className="h-4 w-4" />
                  ) : (
                    <LuCode className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#26332F] truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAFAFA] border border-[#E5E9E7] text-[#6B7773]">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#004643]">
                      +{item.score} คะแนน
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7773] truncate max-w-md mt-0.5">
                    {item.instruction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingActivityItem({ ...item, index: idx })}
                  className="p-2 rounded-lg text-[#6B7773] hover:text-[#26332F] hover:bg-[#FAFAFA]"
                >
                  <LuEdit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteItem(idx)}
                  className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExerciseActivitiesTab;
