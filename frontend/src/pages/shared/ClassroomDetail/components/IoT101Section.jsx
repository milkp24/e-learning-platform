import { useState } from "react";
import { LuBookOpen, LuMapPin, LuLayers, LuCpu, LuSparkles, LuArrowRight } from "react-icons/lu";
import IoTChapterAccordion from "./IoTChapterAccordion";
import {
  CourseProgressCard,
  InteractiveMap,
  SystemBlueprint,
  ComponentCollection,
  UnlockModal,
} from "../../../../features/courses/iot101";

/**
 * IoT101Section Component
 * จัดการหน้าคอร์ส Interactive E-learning สำหรับ IoT 101:
 * - CourseProgressCard แสดงความคืบหน้ารวม (สำหรับ Student) หรือ Guest Discovery Banner (สำหรับ Guest)
 * - แถบสลับ 4 แท็บ:
 *   1. บทเรียนและภารกิจ (Curriculum & Missions)
 *   2. แผนที่สวนเรียนรู้แห่งเมืองนาวา (Interactive Map)
 *   3. พิมพ์เขียวระบบของฉัน (System Blueprint)
 *   4. คลังอุปกรณ์ของฉัน (Component Collection)
 * - UnlockModal แจ้งเตือนเมื่อปลดล็อก
 */
function IoT101Section({
  expandedChapters,
  onToggleChapter,
  onExpandAll,
  onCollapseAll,
  isGuest = false,
  onOpenLockModal,
}) {
  const [activeTab, setActiveTab] = useState("curriculum"); // 'curriculum' | 'map' | 'blueprint' | 'collection'

  const tabs = [
    { id: "curriculum", label: "บทเรียนและภารกิจ", icon: LuBookOpen },
    { id: "map", label: "แผนที่สวนเรียนรู้", icon: LuMapPin },
    { id: "blueprint", label: "พิมพ์เขียวระบบ", icon: LuLayers },
    { id: "collection", label: "อุปกรณ์ของฉัน", icon: LuCpu },
  ];

  return (
    <div className="space-y-6">
      {/* 1. สำหรับ Guest: แสดงแบนเนอร์แนะนำหลักสูตร | สำหรับสมาชิก: แถบความคืบหน้า */}
      {isGuest ? (
        <div className="rounded-3xl border border-[#004643] bg-gradient-to-r from-[#004643] via-[#003835] to-[#26332F] p-6 sm:p-7 text-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/20 px-3 py-1 text-xs font-bold text-[#ABD1C6]">
                <LuSparkles className="h-3.5 w-3.5" />
                <span>โหมดพรีวิวคอร์สเรียน (Guest Discovery)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                สำรวจโครงสร้างและเนื้อหา IoT 101 ได้ครบทุกบทเรียน
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                เรียนรู้ตั้งแต่เซนเซอร์จนถึง AI ผ่านเรื่องราวสวนเรียนรู้แห่งเมืองนาวา 8 บทเรียน 27 ตอนย่อย
                สมัครสมาชิกฟรีเพื่อเข้าสู่บทเรียนและเริ่มทดลองปฏิบัติการ
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onOpenLockModal?.("IoT 101")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ABD1C6] px-6 py-3.5 text-sm font-black text-[#20302C] shadow-md hover:bg-[#9CC5B9] hover:shadow-lg transition cursor-pointer"
              >
                <span>เริ่มเรียนรู้ฟรี</span>
                <LuArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <CourseProgressCard />
      )}

      {/* 2. แท็บสลับมุมมองทั้ง 4 ด้าน */}
      <div className="flex border-b border-[#E5E9E7] overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "border-[#004643] text-[#004643] bg-[#ABD1C6]/10 rounded-t-xl"
                  : "border-transparent text-[#6B7773] hover:text-[#26332F] hover:border-gray-300"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#004643]" : "text-[#6B7773]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. เนื้อหาตามแท็บที่เลือก */}
      {activeTab === "curriculum" && (
        <IoTChapterAccordion
          expandedChapters={expandedChapters}
          onToggleChapter={onToggleChapter}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          isGuest={isGuest}
          onOpenLockModal={onOpenLockModal}
        />
      )}

      {activeTab === "map" && <InteractiveMap />}

      {activeTab === "blueprint" && <SystemBlueprint />}

      {activeTab === "collection" && <ComponentCollection />}

      {/* 4. Modal แจ้งเตือนเมื่อปลดล็อกอุปกรณ์หรือความสามารถใหม่ */}
      <UnlockModal onNavigateTab={(targetTab) => setActiveTab(targetTab)} />
    </div>
  );
}

export default IoT101Section;
