import { useEffect } from "react";
import { LuSparkles, LuX, LuArrowRight, LuLayers, LuCpu } from "react-icons/lu";
import useIoT101Store from "../../../../store/useIoT101Store";

/**
 * UnlockModal Component
 * หน้าต่างแสดงความยินดีเมื่อผู้เรียนทำภารกิจหรือผ่านบทเรียนสำเร็จ
 * ปลดล็อกอุปกรณ์ใหม่, ความสามารถใหม่ (SENSE, ACTUATE, etc.), หรืออัปเกรดพิมพ์เขียว
 */
function UnlockModal({ onNavigateTab }) {
  const { isUnlockModalOpen, latestUnlockInfo, closeUnlockModal } = useIoT101Store();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isUnlockModalOpen) {
        closeUnlockModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUnlockModalOpen, closeUnlockModal]);

  if (!isUnlockModalOpen || !latestUnlockInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={closeUnlockModal}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#ABD1C6] bg-white p-6 sm:p-8 shadow-2xl text-center animate-scaleUp">
        {/* Top Decorative Confetti Accent */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full bg-[#ABD1C6]/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-[#004643]/20 blur-2xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={closeUnlockModal}
          aria-label="ปิดหน้าต่าง"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
        >
          <LuX className="h-5 w-5" />
        </button>

        {/* Celebration Badge Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#004643] to-[#00796B] text-4xl text-white shadow-lg ring-8 ring-[#ABD1C6]/40 animate-bounce">
          <span>{latestUnlockInfo.icon || "🎉"}</span>
        </div>

        {/* Subtitle / Category */}
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/30 px-3.5 py-1 text-xs font-black uppercase text-[#004643]">
          <LuSparkles className="h-3.5 w-3.5" />
          <span>{latestUnlockInfo.category || "ความก้าวหน้าใหม่"}</span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#26332F] tracking-tight">
          {latestUnlockInfo.title}
        </h3>
        {latestUnlockInfo.subtitle && (
          <p className="mt-1 text-sm font-bold text-[#004643]">
            {latestUnlockInfo.subtitle}
          </p>
        )}

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-[#6B7773] leading-relaxed max-w-xs mx-auto">
          {latestUnlockInfo.desc}
        </p>

        {/* Action Buttons */}
        <div className="mt-7 space-y-2.5">
          <button
            type="button"
            onClick={closeUnlockModal}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#004643] px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#003835] active:scale-98 transition cursor-pointer"
          >
            <span>รับทราบและเรียนรู้ต่อ</span>
            <LuArrowRight className="h-4 w-4 text-[#ABD1C6]" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                closeUnlockModal();
                onNavigateTab?.("blueprint");
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white py-2.5 text-xs font-bold text-[#26332F] hover:bg-[#ABD1C6]/15 hover:border-[#ABD1C6] transition cursor-pointer"
            >
              <LuLayers className="h-4 w-4 text-[#004643]" />
              <span>ดูพิมพ์เขียว</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeUnlockModal();
                onNavigateTab?.("collection");
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white py-2.5 text-xs font-bold text-[#26332F] hover:bg-[#ABD1C6]/15 hover:border-[#ABD1C6] transition cursor-pointer"
            >
              <LuCpu className="h-4 w-4 text-[#004643]" />
              <span>ดูคลังอุปกรณ์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnlockModal;
