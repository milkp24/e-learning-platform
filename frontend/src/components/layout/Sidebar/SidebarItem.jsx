import { Link } from "react-router-dom";
import { LuLock } from "react-icons/lu";

/**
 * SidebarItem Component
 * Pure presentational component that renders a navigation item based on its type:
 * - "locked": Button with lock badge for guest restricted items
 * - "adminShortcut": Link with special amber styling for admin shortcut
 * - "hash": Native anchor tag for in-page hash scrolling
 * - "link" (default): Standard React Router Link
 */
function SidebarItem({
  item,
  isActive = false,
  onClick,
  onLockedClick,
}) {
  const ItemIcon = item.icon;

  if (item.type === "locked") {
    return (
      <button
        type="button"
        onClick={() => onLockedClick?.(item.featureName || item.label)}
        className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#26332F] transition hover:bg-[#ABD1C6]/25 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {ItemIcon && <ItemIcon className="w-5 h-5 shrink-0" aria-hidden="true" />}
          <span>{item.label}</span>
        </div>
        <LuLock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
      </button>
    );
  }

  if (item.type === "adminShortcut") {
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 transition"
      >
        {ItemIcon && <ItemIcon className="w-5 h-5 shrink-0" aria-hidden="true" />}
        <span>{item.label}</span>
      </Link>
    );
  }

  if (item.type === "hash") {
    const fullHref = `${item.path}${item.hash}`;

    return (
      <a
        href={fullHref}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
          isActive
            ? "bg-[#ABD1C6] text-[#004643] shadow-xs font-semibold"
            : "text-[#26332F] hover:bg-[#ABD1C6]/25"
        }`}
      >
        {ItemIcon && <ItemIcon className="w-5 h-5 shrink-0" aria-hidden="true" />}
        <span>{item.label}</span>
      </a>
    );
  }

  // Default standard link
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition ${
        isActive
          ? "bg-[#ABD1C6] text-[#004643] shadow-xs font-semibold"
          : "text-[#26332F] hover:bg-[#ABD1C6]/25"
      }`}
    >
      {ItemIcon && <ItemIcon className="w-5 h-5 shrink-0" aria-hidden="true" />}
      <span>{item.label}</span>
    </Link>
  );
}

export default SidebarItem;
