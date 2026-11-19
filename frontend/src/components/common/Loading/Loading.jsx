// ======================================================
// Loading Component (สถานะกำลังโหลดตาม Design System)
// ======================================================
// รองรับ:
// - Variants: spinner, dots, skeleton
// - Sizes: sm, md, lg
// - FullScreen overlay mode

function Loading({
  variant = "spinner",
  size = "md",
  text = "กำลังโหลดข้อมูล...",
  fullScreen = false,
  className = "",
}) {
  const spinnerSizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const spinner = (
    <div
      className={`
        animate-spin rounded-full border-[#ABD1C6] border-t-[#004643]
        ${spinnerSizes[size] || spinnerSizes.md}
      `.trim().replace(/\s+/g, " ")}
      role="status"
      aria-label="loading"
    />
  );

  const dots = (
    <div className="flex items-center gap-1.5" role="status" aria-label="loading">
      <div className="h-2.5 w-2.5 rounded-full bg-[#004643] animate-bounce" />
      <div className="h-2.5 w-2.5 rounded-full bg-[#004643] animate-bounce [animation-delay:0.2s]" />
      <div className="h-2.5 w-2.5 rounded-full bg-[#004643] animate-bounce [animation-delay:0.4s]" />
    </div>
  );

  const skeleton = (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-6 w-1/3 rounded-xl bg-gray-200" />
      <div className="h-20 w-full rounded-2xl bg-gray-100" />
      <div className="h-20 w-full rounded-2xl bg-gray-100" />
    </div>
  );

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {variant === "dots" ? dots : variant === "skeleton" ? skeleton : spinner}
      {text && variant !== "skeleton" && (
        <p className="text-xs sm:text-sm font-semibold text-[#6B7773]">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
}

export default Loading;
