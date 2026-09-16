import { useState, useEffect, useCallback } from "react";
import roleService from "../services/roleService";
import useAuthStore from "../store/useAuthStore";

// ======================================================
// AdminRoles Page (หน้าจัดการสิทธิ์และบทบาทสำหรับ Admin)
// ======================================================
// หน้านี้ทำหน้าที่:
// 1. แสดงรายชื่อบทบาททั้งหมดในระบบ (System Roles Overview)
//    - ดึงข้อมูลจาก GET /api/v1/roles
//    - แสดงบทบาทมาตรฐาน: student, instructor, admin
// 2. ค้นหาและตรวจสอบสิทธิ์ของผู้ใช้ตาม User ID (UUID):
//    - ดึงข้อมูลจาก GET /api/v1/users/<user_id>/roles
// 3. กำหนด Role เพิ่มเติมให้ผู้ใช้:
//    - เรียกใช้ POST /api/v1/users/<user_id>/roles
// 4. ถอน Role ออกจากผู้ใช้:
//    - เรียกใช้ DELETE /api/v1/users/<user_id>/roles/<role_name>
//    - Backend มีการป้องกันไม่ให้ลบ Role สุดท้ายของผู้ใช้ (ต้องเหลืออย่างน้อย 1 บทบาท)
//
// หมายเหตุ Phase 1:
// - ไม่มีการสร้าง Role ใหม่หรือแก้ไข Role (ไม่มี Create/Edit Role form)
// - ระบบยึดตาม 3 บทบาทหลักที่ Backend กำหนดไว้

function AdminRoles() {
  // ดึงข้อมูลผู้ใช้ปัจจุบันและฟังก์ชันตรวจสอบสิทธิ์จาก Zustand Store
  const { user: currentUser, hasRole } = useAuthStore();

  // State สำหรับเก็บรายการ Role ทั้งหมดในระบบ
  const [allRoles, setAllRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // State สำหรับการค้นหาและจัดการสิทธิ์ผู้ใช้
  const [targetUserId, setTargetUserId] = useState("");
  const [activeSearchedUserId, setActiveSearchedUserId] = useState("");
  const [userRoles, setUserRoles] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);

  // State สำหรับการกำหนด Role ใหม่
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // State สำหรับแจ้งเตือน (Notice Banner)
  const [notice, setNotice] = useState(null);

  // ฟังก์ชันแสดงข้อความแจ้งเตือนชั่วคราว (AutoHide ใน 4 วินาที)
  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  // ดึงข้อมูล Role ทั้งหมดในระบบเมื่อ Component ถูก Mount
  // ใช้ API: GET /api/v1/roles (เฉพาะ Admin เท่านั้นที่เรียกได้)
  const fetchSystemRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await roleService.getRoles();
      setAllRoles(data.roles || []);
      if (data.roles && data.roles.length > 0) {
        setSelectedRoleToAssign(data.roles[0].role_name);
      }
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "ไม่สามารถโหลดข้อมูล System Roles ได้"
      );
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemRoles();
  }, [fetchSystemRoles]);

  // ค้นหา Role ของ User ตาม User ID
  // ใช้ API: GET /api/v1/users/<user_id>/roles
  const handleSearchUserRoles = async (e) => {
    if (e) e.preventDefault();
    const cleanId = targetUserId.trim();
    if (!cleanId) {
      showNotice("error", "กรุณาระบุ User ID (UUID) ที่ต้องการตรวจสอบ");
      return;
    }

    setSearchingUser(true);
    setUserRoles(null);
    try {
      const data = await roleService.getUserRoles(cleanId);
      // Backend ส่งกลับมาเป็น { user_id, roles: [ { role_id, role_name }, ... ] }
      setUserRoles(data.roles || []);
      setActiveSearchedUserId(cleanId);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "ไม่พบข้อมูลผู้ใช้ หรือ User ID ไม่ถูกต้อง";
      showNotice("error", msg);
    } finally {
      setSearchingUser(false);
    }
  };

  // กำหนด Role ใหม่ให้ผู้ใช้
  // ใช้ API: POST /api/v1/users/<user_id>/roles
  // Payload: { role_name }
  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!activeSearchedUserId) {
      showNotice("error", "กรุณาค้นหาผู้ใช้ก่อนทำการกำหนดสิทธิ์");
      return;
    }
    if (!selectedRoleToAssign) {
      showNotice("error", "กรุณาเลือกบทบาทที่ต้องการกำหนด");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await roleService.assignRole(
        activeSearchedUserId,
        selectedRoleToAssign
      );
      showNotice("success", res.message || "กำหนดบทบาทสำเร็จ");
      // อัปเดตรายการ Role ของผู้ใช้จากผลลัพธ์ที่ Backend ส่งกลับมา
      setUserRoles(res.roles || []);
    } catch (err) {
      const msg =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการกำหนดบทบาท";
      showNotice("error", msg);
    } finally {
      setIsAssigning(false);
    }
  };

  // ถอน Role ออกจากผู้ใช้
  // ใช้ API: DELETE /api/v1/users/<user_id>/roles/<role_name>
  const handleRemoveRole = async (roleName) => {
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการถอนบทบาท '${roleName}' ออกจากผู้ใช้นี้?`
      )
    ) {
      return;
    }

    try {
      const res = await roleService.removeRole(activeSearchedUserId, roleName);
      showNotice("success", res.message || "ถอนบทบาทเรียบร้อยแล้ว");
      // อัปเดตรายการ Role ของผู้ใช้จากผลลัพธ์ที่ Backend ส่งกลับมา
      setUserRoles(res.roles || []);
    } catch (err) {
      const msg =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการถอนบทบาท";
      showNotice("error", msg);
    }
  };

  // คำอธิบายและสี Badge ตาม Role สำหรับช่วยเหลือผู้ดูแลระบบ
  const getRoleBadge = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "admin":
        return {
          bg: "bg-red-100 text-red-700 border-red-200",
          desc: "ผู้ดูแลระบบ — มีสิทธิ์สูงสุด จัดการห้องเรียนและสิทธิ์ทั้งหมด",
          icon: "🛡️",
        };
      case "instructor":
        return {
          bg: "bg-purple-100 text-purple-700 border-purple-200",
          desc: "ผู้สอน — สร้างและจัดการห้องเรียนของตนเอง จัดการบทเรียนและเนื้อหา",
          icon: "🎓",
        };
      case "student":
        return {
          bg: "bg-emerald-100 text-emerald-700 border-emerald-200",
          desc: "ผู้เรียน — ดูห้องเรียน เข้าร่วมห้องเรียน เข้าชมบทเรียนและเนื้อหา",
          icon: "📖",
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-700 border-gray-200",
          desc: "บทบาททั่วไปในระบบ",
          icon: "👤",
        };
    }
  };

  // ตรวจสอบสิทธิ์เบื้องต้น: หน้า Admin ต้องจำกัดเฉพาะผู้ที่มี role 'admin'
  if (!hasRole("admin")) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="text-4xl mb-3">🚫</div>
        <h2 className="text-xl font-bold text-red-800">
          ไม่มีสิทธิ์เข้าถึงหน้านี้
        </h2>
        <p className="mt-2 text-sm text-red-600">
          หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* ส่วนหัวของหน้า (Header) */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">
            🛡️
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 md:text-3xl">
              จัดการสิทธิ์และบทบาท (Admin Role Management)
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ควบคุมการกำหนดและถอนสิทธิ์ของผู้ใช้งานในระบบตามข้อกำหนด Module 2
            </p>
          </div>
        </div>
      </div>

      {/* ข้อความแจ้งเตือนสถานะการทำงาน (Notice Alert) */}
      {notice && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium transition ${
            notice.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* ====================================================
          ส่วนที่ 1: รายการบทบาททั้งหมดในระบบ (System Roles Overview)
      ==================================================== */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              บทบาททั้งหมดในระบบ (System Roles)
            </h2>
            <p className="text-xs text-gray-500">
              ดึงข้อมูลจาก <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">GET /api/v1/roles</code>
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-mono text-xs font-semibold text-gray-600">
            {allRoles.length} บทบาท
          </span>
        </div>

        {loadingRoles ? (
          <div className="py-8 text-center text-sm text-gray-500">
            กำลังโหลดข้อมูลบทบาท...
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {allRoles.map((r) => {
              const info = getRoleBadge(r.role_name);
              return (
                <div
                  key={r.role_id || r.role_name}
                  className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{info.icon}</span>
                    <span
                      className={`rounded-lg border px-2.5 py-0.5 font-mono text-xs font-bold uppercase ${info.bg}`}
                    >
                      {r.role_name}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-gray-600">
                    {info.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================
          ส่วนที่ 2: ค้นหาและจัดการสิทธิ์ผู้ใช้ (User Role Lookup & Manage)
      ==================================================== */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            ค้นหาและจัดการสิทธิ์ผู้ใช้งาน (Manage User Roles)
          </h2>
          <p className="text-xs text-gray-500">
            ระบุ User ID (UUID) เพื่อตรวจสอบและกำหนดสิทธิ์ผู้ใช้รายบุคคล
          </p>
        </div>

        {/* ฟอร์มค้นหา User ID */}
        <form onSubmit={handleSearchUserRoles} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="ระบุ User ID (เช่น 123e4567-e89b-12d3-a456-426614174000)"
              className="w-full rounded-2xl border border-gray-300 p-3.5 font-mono text-sm focus:border-[#004643] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searchingUser}
            className="rounded-2xl bg-[#ABD1C6] px-6 py-3.5 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] disabled:opacity-50 transition"
          >
            {searchingUser ? "กำลังค้นหา..." : "ตรวจสอบสิทธิ์"}
          </button>
        </form>

        {/* ผลลัพธ์การค้นหา และเครื่องมือจัดการ Role */}
        {userRoles && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                ผลการค้นหาสำหรับผู้ใช้:
              </span>
              <div className="mt-1 font-mono text-sm font-bold text-gray-800">
                {activeSearchedUserId}
              </div>
            </div>

            {/* รายการ Role ปัจจุบันของผู้ใช้ */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                บทบาทปัจจุบัน (Current Roles)
              </label>
              <div className="flex flex-wrap gap-3">
                {userRoles.length === 0 ? (
                  <span className="text-sm text-gray-500">ไม่มีบทบาท</span>
                ) : (
                  userRoles.map((r) => {
                    const rName = r.role_name || r;
                    const info = getRoleBadge(rName);
                    return (
                      <div
                        key={r.role_id || rName}
                        className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 shadow-sm bg-white ${info.bg}`}
                      >
                        <span className="font-mono text-xs font-bold uppercase">
                          {rName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(rName)}
                          title={`ถอนสิทธิ์ ${rName}`}
                          className="ml-1 rounded-full p-0.5 text-red-500 hover:bg-red-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                * หมายเหตุ: Backend ป้องกันไม่ให้ลบ Role สุดท้ายของผู้ใช้ (ผู้ใช้ต้องมีอย่างน้อย 1 บทบาท)
              </p>
            </div>

            {/* ฟอร์มกำหนด Role เพิ่มเติม */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                กำหนดบทบาทเพิ่มเติม (Assign New Role)
              </label>
              <form onSubmit={handleAssignRole} className="flex flex-wrap gap-3">
                <select
                  value={selectedRoleToAssign}
                  onChange={(e) => setSelectedRoleToAssign(e.target.value)}
                  className="rounded-xl border border-gray-300 p-2.5 text-sm focus:border-[#004643] focus:outline-none"
                >
                  {allRoles.map((r) => (
                    <option key={r.role_id || r.role_name} value={r.role_name}>
                      {r.role_name.toUpperCase()}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isAssigning}
                  className="rounded-xl bg-[#004643] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#003835] disabled:opacity-50 transition"
                >
                  {isAssigning ? "กำลังกำหนดสิทธิ์..." : "+ เพิ่มบทบาทนี้ให้ผู้ใช้"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* คำแนะนำเพิ่มเติมสำหรับ Admin */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-800 leading-relaxed">
        <span className="font-bold">💡 ข้อมูลเพิ่มเติมสำหรับผู้ดูแลระบบ:</span>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            คุณสามารถคัดลอก User ID ของตนเองได้จากหน้า{" "}
            <a href="/profile" className="font-semibold underline">
              โปรไฟล์ (Profile)
            </a>{" "}
            เพื่อทดสอบการตรวจสอบสิทธิ์
          </li>
          <li>
            การเปลี่ยน Role ของผู้ใช้มีผลทันทีที่ระดับ Database เนื่องจาก Decorator{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">@roles_required()</code>{" "}
            จะดึงข้อมูล Role สดจาก Database เสมอโดยไม่ต้องพึ่ง Payload ใน Token
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AdminRoles;
