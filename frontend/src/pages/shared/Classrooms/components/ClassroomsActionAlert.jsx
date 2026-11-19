import { LuCheck, LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";

/**
 * ClassroomsActionAlert Component
 * Displays temporary action feedback notification.
 */
function ClassroomsActionAlert({ actionMessage }) {
  if (!actionMessage) return null;
  const message = actionMessage;

  return (
    <div
      className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
        message.type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {message.type === "success" ? (
        <LuCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      ) : (
        <LuAlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
      )}
      <span>{message.text}</span>
    </div>
  );
}

export default ClassroomsActionAlert;
