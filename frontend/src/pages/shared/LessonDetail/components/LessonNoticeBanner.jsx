/**
 * LessonNoticeBanner Component
 * Notification alert banner for lesson operations.
 */
function LessonNoticeBanner({ actionNotice }) {
  if (!actionNotice) return null;

  return (
    <div
      className={`rounded-xl p-4 text-sm font-medium transition ${
        actionNotice.type === "success"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {actionNotice.text}
    </div>
  );
}

export default LessonNoticeBanner;
