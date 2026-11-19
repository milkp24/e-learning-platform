
/**
 * SecurityPoliciesSection Component
 * Displays grid of active system security policies (JWT rotation, JTI revocation, live RBAC, dynamic idle timeout).
 */
function SecurityPoliciesSection({ policies }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {policies.map((p, idx) => (
        <div
          key={idx}
          className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 shadow-2xs space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xl text-[#004643]">
                {typeof p.icon === "function" ? (
                  <p.icon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  p.icon
                )}
              </span>
              <div>
                <h4 className="text-sm font-bold text-[#26332F]">
                  {p.title}
                </h4>
                <span className="text-[11px] font-mono text-[#6B7773]">
                  {p.badge}
                </span>
              </div>
            </div>
            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold uppercase text-emerald-800">
              {p.status}
            </span>
          </div>
          <p className="text-xs text-[#6B7773] leading-relaxed">
            {p.description}
          </p>
        </div>
      ))}
    </div>
  );
}
export default SecurityPoliciesSection;
