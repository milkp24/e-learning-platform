import { useState } from "react";
import { LuCpu, LuLock, LuCheck, LuZap } from "react-icons/lu";
import { IOT_COMPONENTS } from "../../../../data/iot101InteractiveData";
import useIoT101Store from "../../../../store/useIoT101Store";

/**
 * ComponentCollection Component
 * ส่วนแสดงอุปกรณ์ 10 ชนิดที่ผู้เรียนปลดล็อกระหว่างเรียน
 * สถานะ: ปลดล็อกแล้ว (Unlocked) / ยังไม่ปลดล็อก (Locked)
 * ปลดล็อกตามความคืบหน้าการผ่าน Episode โดยไม่กระทบ Backend
 */
function ComponentCollection({ className = "" }) {
  const { unlockedComponentIds } = useIoT101Store();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const unlockedCount = unlockedComponentIds.length;
  const totalComponents = IOT_COMPONENTS.length;

  const categories = [
    { id: "all", label: "ทั้งหมด" },
    { id: "Sensor", label: "เซนเซอร์ (Sensors)" },
    { id: "Controller", label: "สมองกล (Controllers)" },
    { id: "Actuator", label: "อุปกรณ์ขับเคลื่อน (Actuators)" },
    { id: "Network", label: "โครงข่าย (Network & Protocol)" },
  ];

  const filteredComponents = IOT_COMPONENTS.filter((comp) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "Network") {
      return comp.category === "Network" || comp.category === "Protocol";
    }
    return comp.category === selectedCategory;
  });

  return (
    <div
      className={`rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
    >
      {/* 1. Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E9E7] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#004643] text-white">
              <LuCpu className="h-4 w-4 text-[#ABD1C6]" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#004643]">
              คลังอุปกรณ์ที่ครอบครอง (Component Collection)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#26332F] mt-1">
            อุปกรณ์และเทคโนโลยีของฉัน
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7773] mt-0.5">
            สะสมและปลดล็อกอุปกรณ์ฮาร์ดแวร์และโปรโตคอลจากการผ่านภารกิจในแต่ละ Episode
          </p>
        </div>

        {/* Stats Card */}
        <div className="flex items-center gap-3 bg-[#FAFAFA] border border-[#E5E9E7] rounded-2xl px-4 py-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643] font-black text-sm">
            {unlockedCount}/{totalComponents}
          </div>
          <div>
            <div className="text-xs font-bold text-[#26332F]">
              ปลดล็อกแล้ว {Math.round((unlockedCount / totalComponents) * 100)}%
            </div>
            <div className="text-[11px] text-[#6B7773]">
              เหลืออีก {totalComponents - unlockedCount} ชิ้นให้ค้นหา
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-[#004643] text-white shadow-xs"
                : "bg-[#FAFAFA] border border-[#E5E9E7] text-[#6B7773] hover:text-[#26332F] hover:bg-gray-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Components Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {filteredComponents.map((comp) => {
          const isUnlocked = unlockedComponentIds.includes(comp.id);

          return (
            <div
              key={comp.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                isUnlocked
                  ? "border-[#ABD1C6] bg-gradient-to-b from-white to-[#FAFAFA] shadow-xs hover:shadow-md hover:border-[#004643] hover:-translate-y-0.5"
                  : "border-gray-200 bg-gray-50/60 opacity-65"
              }`}
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-xs ${
                      isUnlocked
                        ? "bg-[#004643] text-white ring-2 ring-[#ABD1C6]/50"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <span>{comp.icon}</span>
                  </div>

                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      <LuCheck className="h-3 w-3" />
                      <span>ปลดล็อกแล้ว</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                      <LuLock className="h-3 w-3" />
                      <span>ล็อกอยู่</span>
                    </span>
                  )}
                </div>

                {/* Component Info */}
                <h4
                  className={`text-sm font-extrabold ${
                    isUnlocked ? "text-[#26332F]" : "text-gray-600"
                  }`}
                >
                  {comp.name}
                </h4>
                <p
                  className={`text-xs font-semibold ${
                    isUnlocked ? "text-[#004643]" : "text-gray-500"
                  }`}
                >
                  {comp.thaiName}
                </p>

                <p className="mt-2 text-xs text-[#6B7773] line-clamp-3 leading-relaxed">
                  {comp.description}
                </p>
              </div>

              {/* Specs & Unlock Hint */}
              <div className="mt-4 pt-3 border-t border-[#E5E9E7] text-[11px]">
                {isUnlocked ? (
                  <div className="flex items-center justify-between text-[#6B7773]">
                    <span className="font-mono">{comp.signalType}</span>
                    <span className="font-bold text-[#004643]">{comp.category}</span>
                  </div>
                ) : (
                  <div className="text-amber-700 font-semibold flex items-center gap-1">
                    <LuZap className="h-3 w-3 shrink-0" />
                    <span>ปลดล็อกใน {comp.unlockEpisodeId.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ComponentCollection;
