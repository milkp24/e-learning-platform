/**
 * PageHeader Component
 * Unified header for all Super Admin pages following the Jade Design System
 */
function PageHeader({ title, description, actions = null, badge = null, children = null }) {
  const actionContent = actions || children;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E9E7]">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#26332F]">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center rounded-md bg-[#ABD1C6]/30 px-2.5 py-0.5 text-xs font-bold text-[#26332F]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[#6B7773] font-medium max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actionContent && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actionContent}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
