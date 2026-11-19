/**
 * SecurityMetricsSection Component
 * Displays summary metric cards for Access TTL, Refresh TTL, Blocklist status, and Security score.
 */
function SecurityMetricsSection({ metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">Access Token TTL</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">{metrics?.accessTokenTtl || "15 นาที"}</p>
        <span className="text-[11px] font-semibold text-emerald-700">Short-lived JWT</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">Refresh Token TTL</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">{metrics?.refreshTokenTtl || "7 วัน"}</p>
        <span className="text-[11px] font-semibold text-emerald-700">With Auto-Rotation</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">Blocklist Status</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">{metrics?.blocklistStatus || "Active"}</p>
        <span className="text-[11px] font-semibold text-teal-800">JTI Revocation enabled</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">Security Score</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">{metrics?.securityScore || "98/100"}</p>
        <span className="text-[11px] font-semibold text-emerald-700">Enterprise Standard</span>
      </div>
    </div>
  );
}

export default SecurityMetricsSection;
