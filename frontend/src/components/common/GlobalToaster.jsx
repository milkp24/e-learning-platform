import { LuCheck, LuCircleAlert, LuInfo, LuLoader, LuX } from "react-icons/lu";
import useToastStore from "../../store/useToastStore";

// ======================================================
// GlobalToaster — แถบแจ้งผลการทำงานมุมขวาบน (ใต้แถบเมนูด้านบน) ทุกหน้า ทุกบทบาท
// เรียกใช้ผ่าน notify.success / notify.error ใน store/useToastStore.js
// ======================================================

const STYLES = {
  success: { box: "border-[#ABD1C6] bg-white text-[#004643]", icon: LuCheck, iconClass: "text-emerald-600" },
  error: { box: "border-rose-200 bg-rose-50 text-rose-700", icon: LuCircleAlert, iconClass: "text-rose-600" },
  info: { box: "border-[#E5E9E7] bg-white text-[#26332F]", icon: LuInfo, iconClass: "text-[#004643]" },
  loading: { box: "border-[#E5E9E7] bg-white text-[#26332F]", icon: LuLoader, iconClass: "text-[#004643] animate-spin" },
};

function GlobalToaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const style = STYLES[t.type] || STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs sm:text-sm font-bold shadow-lg animate-fadeIn ${style.box}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClass}`} aria-hidden="true" />
            <span className="flex-1 break-words">{t.text}</span>
            {t.type !== "loading" && (
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="ปิดการแจ้งเตือน"
                className="-m-1 rounded-lg p-1 opacity-60 hover:bg-black/5 hover:opacity-100 transition cursor-pointer"
              >
                <LuX className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default GlobalToaster;
