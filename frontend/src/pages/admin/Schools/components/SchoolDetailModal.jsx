import { useState, useEffect, useCallback } from "react";
import {
  LuX,
  LuBuilding,
  LuMail,
  LuPhone,
  LuMapPin,
  LuPencil,
  LuGraduationCap,
  LuUsers,
  LuPlus,
  LuTrash2,
  LuShieldCheck,
  LuUserMinus,
  LuSearch,
  LuRefreshCw,
  LuTriangleAlert as LuAlertTriangle,
} from "react-icons/lu";
import adminService from "../../../../services/adminService";
import CreateClassroomModal from "./CreateClassroomModal";
import EditClassroomModal from "./EditClassroomModal";
import DeleteClassroomConfirmModal from "./DeleteClassroomConfirmModal";
import AddMemberModal from "./AddMemberModal";
import EditMemberRoleModal from "./EditMemberRoleModal";
import RemoveMemberModal from "./RemoveMemberModal";

/**
 * SchoolDetailModal Component
 * Comprehensive management hub for School, Classrooms, and Members
 */
function SchoolDetailModal({
  isOpen,
  onClose,
  school,
  onOpenEdit,
  canEditSchool,
  onSchoolDataChanged,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "classrooms" | "members"

  // Classrooms State
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [classroomSearch, setClassroomSearch] = useState("");
  const [classroomModalMode, setClassroomModalMode] = useState(null); // "create" | "edit" | "delete"
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  // Members State
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("");
  const [memberModalMode, setMemberModalMode] = useState(null); // "add" | "edit_role" | "remove"
  const [selectedMember, setSelectedMember] = useState(null);

  // General Notification
  const [notice, setNotice] = useState(null);

  // Fetch Classrooms
  const fetchClassrooms = useCallback(async () => {
    if (!school) return;
    try {
      setLoadingClassrooms(true);
      const res = await adminService.getSchoolClassrooms(school.school_id, {
        search: classroomSearch.trim() || undefined,
      });
      setClassrooms(res.classrooms || []);
    } catch (err) {
      console.error("Failed to fetch classrooms", err);
    } finally {
      setLoadingClassrooms(false);
    }
  }, [school, classroomSearch]);

  // Fetch Members
  const fetchMembers = useCallback(async () => {
    if (!school) return;
    try {
      setLoadingMembers(true);
      const res = await adminService.getSchoolMembers(school.school_id, {
        search: memberSearch.trim() || undefined,
        role: memberRoleFilter || undefined,
      });
      setMembers(res.members || []);
    } catch (err) {
      console.error("Failed to fetch school members", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [school, memberSearch, memberRoleFilter]);

  // Load data when tab changes or school changes
  useEffect(() => {
    if (!isOpen || !school) return;
    if (activeTab === "classrooms") {
      fetchClassrooms();
    } else if (activeTab === "members") {
      fetchMembers();
    }
  }, [isOpen, school, activeTab, fetchClassrooms, fetchMembers]);

  // Reset tab on school change
  useEffect(() => {
    if (school) {
      setClassrooms(school.classrooms || []);
      setNotice(null);
    }
  }, [school]);

  if (!isOpen || !school) return null;

  // Handlers for Classroom CRUD
  const handleCreateClassroom = async (payload) => {
    await adminService.createSchoolClassroom(school.school_id, payload);
    setNotice({ type: "success", message: "สร้างห้องเรียนใหม่เรียบร้อยแล้ว" });
    fetchClassrooms();
    onSchoolDataChanged && onSchoolDataChanged();
  };

  const handleUpdateClassroom = async (payload) => {
    await adminService.updateSchoolClassroom(school.school_id, selectedClassroom.classroom_id, payload);
    setNotice({ type: "success", message: "อัปเดตข้อมูลห้องเรียนเรียบร้อยแล้ว" });
    fetchClassrooms();
    onSchoolDataChanged && onSchoolDataChanged();
  };

  const handleDeleteClassroom = async (cr) => {
    await adminService.deleteSchoolClassroom(school.school_id, cr.classroom_id);
    setNotice({ type: "success", message: "ลบห้องเรียนเรียบร้อยแล้ว" });
    fetchClassrooms();
    onSchoolDataChanged && onSchoolDataChanged();
  };

  // Handlers for Member Management
  const handleAddMember = async (payload) => {
    await adminService.addSchoolMember(school.school_id, payload);
    setNotice({ type: "success", message: "เพิ่มสมาชิกเข้าโรงเรียนเรียบร้อยแล้ว" });
    fetchMembers();
    onSchoolDataChanged && onSchoolDataChanged();
  };

  const handleUpdateMemberRole = async (mem, newRole) => {
    await adminService.updateSchoolMemberRole(school.school_id, mem.school_user_id, { role: newRole });
    setNotice({ type: "success", message: "เปลี่ยนบทบาทสมาชิกเรียบร้อยแล้ว" });
    fetchMembers();
    onSchoolDataChanged && onSchoolDataChanged();
  };

  const handleRemoveMember = async (mem) => {
    await adminService.removeSchoolMember(school.school_id, mem.school_user_id);
    setNotice({ type: "success", message: "นำสมาชิกออกจากโรงเรียนเรียบร้อยแล้ว" });
    fetchMembers();
    onSchoolDataChanged && onSchoolDataChanged();
  };

  const classroomCount = school.classroom_count ?? classrooms.length;
  const memberCount = school.member_count ?? members.length;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="school-detail-modal-title"
      >
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
                <LuBuilding className="h-5 w-5" />
              </span>
              <div>
                <h2 id="school-detail-modal-title" className="text-base font-black text-[#26332F]">
                  {school.name}
                </h2>
                <p className="text-xs text-[#6B7773]">
                  {school.code ? `รหัสสถานศึกษา: ${school.code} | ` : ""}การจัดการโรงเรียน ห้องเรียน และสมาชิก
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-[#E5E9E7] px-6 bg-white overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "overview"
                  ? "border-[#004643] text-[#004643]"
                  : "border-transparent text-[#6B7773] hover:text-[#26332F]"
              }`}
            >
              <LuBuilding className="h-4 w-4" />
              <span>ภาพรวมและข้อมูลติดต่อ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("classrooms")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "classrooms"
                  ? "border-[#004643] text-[#004643]"
                  : "border-transparent text-[#6B7773] hover:text-[#26332F]"
              }`}
            >
              <LuGraduationCap className="h-4 w-4" />
              <span>ห้องเรียน</span>
              <span className="rounded-full bg-[#ABD1C6]/30 px-2 py-0.5 text-[10px] text-[#004643] font-mono">
                {classroomCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === "members"
                  ? "border-[#004643] text-[#004643]"
                  : "border-transparent text-[#6B7773] hover:text-[#26332F]"
              }`}
            >
              <LuUsers className="h-4 w-4" />
              <span>สมาชิกในโรงเรียน</span>
              <span className="rounded-full bg-[#ABD1C6]/30 px-2 py-0.5 text-[10px] text-[#004643] font-mono">
                {memberCount}
              </span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto p-6 space-y-4 flex-1">
            {/* Notice / Alert */}
            {notice && (
              <div
                className={`flex items-center justify-between gap-2.5 rounded-2xl p-3 text-xs animate-in fade-in duration-150 ${
                  notice.type === "success"
                    ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                <span>{notice.message}</span>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-inherit hover:opacity-75 cursor-pointer"
                >
                  <LuX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Main Info Card */}
                <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-4.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-[#26332F]">{school.name}</h3>
                      {school.code && (
                        <p className="text-xs font-mono text-[#6B7773]">รหัสสถานศึกษา: {school.code}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase self-start sm:self-auto ${
                        school.status === "active"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300"
                      }`}
                    >
                      {school.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E9E7]">
                    <div className="flex items-center gap-2.5 rounded-xl bg-white border border-[#E5E9E7] p-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                        <LuGraduationCap className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[11px] text-[#6B7773]">ห้องเรียนทั้งหมด</div>
                        <div className="text-xs font-bold text-[#26332F]">{classroomCount} ห้อง</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl bg-white border border-[#E5E9E7] p-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                        <LuUsers className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[11px] text-[#6B7773]">สมาชิกทั้งหมด</div>
                        <div className="text-xs font-bold text-[#26332F]">{memberCount} คน</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#26332F]">
                    ข้อมูลการติดต่อและที่อยู่
                  </h4>
                  <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <LuMail className="h-4 w-4 text-[#6B7773] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#6B7773] block text-[11px]">อีเมลติดต่อ:</span>
                        <span className="font-mono text-[#26332F]">
                          {school.contact_email || "ไม่ระบุ"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#E5E9E7]/60">
                      <LuPhone className="h-4 w-4 text-[#6B7773] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#6B7773] block text-[11px]">เบอร์โทรศัพท์:</span>
                        <span className="text-[#26332F]">
                          {school.contact_phone || "ไม่ระบุ"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#E5E9E7]/60">
                      <LuMapPin className="h-4 w-4 text-[#6B7773] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#6B7773] block text-[11px]">ที่อยู่สถานศึกษา:</span>
                        <span className="text-[#26332F] leading-relaxed">
                          {school.address || "ไม่ระบุ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CLASSROOMS */}
            {activeTab === "classrooms" && (
              <div className="space-y-3.5">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="relative flex-1 max-w-sm">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7773]" />
                    <input
                      type="text"
                      value={classroomSearch}
                      onChange={(e) => setClassroomSearch(e.target.value)}
                      placeholder="ค้นหาห้องเรียน..."
                      className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-9 pr-3.5 py-1.5 text-xs text-[#26332F] placeholder-[#6B7773] focus:border-[#004643] focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchClassrooms}
                      disabled={loadingClassrooms}
                      title="รีเฟรชข้อมูล"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
                    >
                      <LuRefreshCw className={`h-3.5 w-3.5 ${loadingClassrooms ? "animate-spin" : ""}`} />
                    </button>

                    {canEditSchool && (
                      <button
                        type="button"
                        onClick={() => setClassroomModalMode("create")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-3.5 py-1.5 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-xs cursor-pointer"
                      >
                        <LuPlus className="h-3.5 w-3.5" />
                        <span>เพิ่มห้องเรียน</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Classrooms List / Table */}
                {loadingClassrooms ? (
                  <div className="rounded-2xl border border-[#E5E9E7] p-8 text-center text-xs text-[#6B7773]">
                    กำลังโหลดข้อมูลห้องเรียน...
                  </div>
                ) : classrooms.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E5E9E7] p-8 text-center text-xs text-[#6B7773] space-y-2">
                    <p>ยังไม่มีห้องเรียนในโรงเรียนนี้</p>
                    {canEditSchool && (
                      <button
                        type="button"
                        onClick={() => setClassroomModalMode("create")}
                        className="inline-flex items-center gap-1 font-bold text-[#004643] hover:underline cursor-pointer"
                      >
                        <LuPlus className="h-3.5 w-3.5" />
                        <span>สร้างห้องเรียนแรก</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#E5E9E7] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-[#6B7773] font-bold">
                            <th className="py-2.5 px-3">ชื่อห้องเรียน</th>
                            <th className="py-2.5 px-3">ระดับชั้น</th>
                            <th className="py-2.5 px-3">ปีการศึกษา</th>
                            <th className="py-2.5 px-3">จำนวนนักเรียน</th>
                            <th className="py-2.5 px-3">สถานะ</th>
                            {canEditSchool && <th className="py-2.5 px-3 text-right">การจัดการ</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E9E7] bg-white">
                          {classrooms.map((cr) => (
                            <tr key={cr.classroom_id} className="hover:bg-[#FAFAFA] transition">
                              <td className="py-2.5 px-3 font-bold text-[#26332F]">
                                {cr.classroom_name}
                              </td>
                              <td className="py-2.5 px-3 text-[#6B7773]">
                                {cr.grade_level || "-"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#6B7773]">
                                {cr.academic_year || "-"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#26332F]">
                                {cr.student_count ?? 0} คน
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    cr.status === "active"
                                      ? "bg-emerald-50 text-emerald-800"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {(cr.status || "active") === "active" ? "ใช้งาน" : "ปิดใช้งาน"}
                                </span>
                              </td>
                              {canEditSchool && (
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassroom(cr);
                                        setClassroomModalMode("edit");
                                      }}
                                      title="แก้ไขห้องเรียน"
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E9E7] text-[#6B7773] hover:bg-[#ABD1C6]/30 hover:text-[#004643] transition cursor-pointer"
                                    >
                                      <LuPencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedClassroom(cr);
                                        setClassroomModalMode("delete");
                                      }}
                                      title="ลบห้องเรียน"
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E9E7] text-[#6B7773] hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                                    >
                                      <LuTrash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: MEMBERS */}
            {activeTab === "members" && (
              <div className="space-y-3.5">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7773]" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="ค้นหาสมาชิก..."
                        className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-9 pr-3.5 py-1.5 text-xs text-[#26332F] placeholder-[#6B7773] focus:border-[#004643] focus:bg-white focus:outline-none transition"
                      />
                    </div>

                    <select
                      value={memberRoleFilter}
                      onChange={(e) => setMemberRoleFilter(e.target.value)}
                      className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-2.5 py-1.5 text-xs text-[#26332F] focus:border-[#004643] focus:outline-none transition cursor-pointer"
                    >
                      <option value="">ทุกบทบาท</option>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      <option value="member">Member</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchMembers}
                      disabled={loadingMembers}
                      title="รีเฟรชข้อมูล"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
                    >
                      <LuRefreshCw className={`h-3.5 w-3.5 ${loadingMembers ? "animate-spin" : ""}`} />
                    </button>

                    {canEditSchool && (
                      <button
                        type="button"
                        onClick={() => setMemberModalMode("add")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-3.5 py-1.5 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-xs cursor-pointer"
                      >
                        <LuPlus className="h-3.5 w-3.5" />
                        <span>เพิ่มสมาชิก</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Members List / Table */}
                {loadingMembers ? (
                  <div className="rounded-2xl border border-[#E5E9E7] p-8 text-center text-xs text-[#6B7773]">
                    กำลังโหลดข้อมูลสมาชิก...
                  </div>
                ) : members.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E5E9E7] p-8 text-center text-xs text-[#6B7773] space-y-2">
                    <p>ยังไม่มีสมาชิกในโรงเรียนนี้</p>
                    {canEditSchool && (
                      <button
                        type="button"
                        onClick={() => setMemberModalMode("add")}
                        className="inline-flex items-center gap-1 font-bold text-[#004643] hover:underline cursor-pointer"
                      >
                        <LuPlus className="h-3.5 w-3.5" />
                        <span>เพิ่มสมาชิกคนแรก</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#E5E9E7] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-[#6B7773] font-bold">
                            <th className="py-2.5 px-3">ชื่อ-นามสกุล / สมาชิก</th>
                            <th className="py-2.5 px-3">อีเมล</th>
                            <th className="py-2.5 px-3">บทบาทในโรงเรียน</th>
                            <th className="py-2.5 px-3">วันที่เข้าร่วม</th>
                            {canEditSchool && <th className="py-2.5 px-3 text-right">การจัดการ</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E9E7] bg-white">
                          {members.map((m) => (
                            <tr key={m.school_user_id} className="hover:bg-[#FAFAFA] transition">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-[#26332F] block">
                                  {m.display_name}
                                </span>
                                {(m.first_name || m.last_name) && (
                                  <span className="text-[11px] text-[#6B7773]">
                                    {[m.first_name, m.last_name].filter(Boolean).join(" ")}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#6B7773]">
                                {m.email}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                    m.school_role === "admin"
                                      ? "bg-purple-50 text-[#004643] border border-[#ABD1C6]"
                                      : m.school_role === "teacher"
                                      ? "bg-teal-50 text-teal-800"
                                      : "bg-emerald-50 text-emerald-800"
                                  }`}
                                >
                                  {m.school_role}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B7773]">
                                {m.joined_at ? new Date(m.joined_at).toLocaleDateString("th-TH") : "-"}
                              </td>
                              {canEditSchool && (
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMember(m);
                                        setMemberModalMode("edit_role");
                                      }}
                                      title="เปลี่ยนบทบาทสมาชิก"
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E9E7] text-[#6B7773] hover:bg-[#ABD1C6]/30 hover:text-[#004643] transition cursor-pointer"
                                    >
                                      <LuShieldCheck className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedMember(m);
                                        setMemberModalMode("remove");
                                      }}
                                      title="นำสมาชิกออกจากโรงเรียน"
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E9E7] text-[#6B7773] hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                                    >
                                      <LuUserMinus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-2.5 px-6 py-4 bg-[#FAFAFA] border-t border-[#E5E9E7]">
            <div className="text-[11px] text-[#6B7773]">
              {activeTab === "classrooms" && `${classrooms.length} ห้องเรียน`}
              {activeTab === "members" && `${members.length} สมาชิก`}
              {activeTab === "overview" && `รหัส: ${school.code || "-"}`}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
              >
                ปิด
              </button>
              {canEditSchool && activeTab === "overview" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEdit && onOpenEdit(school);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-xs cursor-pointer"
                >
                  <LuPencil className="h-3.5 w-3.5" />
                  <span>แก้ไขข้อมูลโรงเรียน</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals for Classrooms */}
      <CreateClassroomModal
        isOpen={classroomModalMode === "create"}
        onClose={() => setClassroomModalMode(null)}
        schoolId={school.school_id}
        schoolName={school.name}
        onSubmit={handleCreateClassroom}
      />

      <EditClassroomModal
        isOpen={classroomModalMode === "edit"}
        onClose={() => {
          setClassroomModalMode(null);
          setSelectedClassroom(null);
        }}
        classroom={selectedClassroom}
        schoolName={school.name}
        onSubmit={handleUpdateClassroom}
      />

      <DeleteClassroomConfirmModal
        isOpen={classroomModalMode === "delete"}
        onClose={() => {
          setClassroomModalMode(null);
          setSelectedClassroom(null);
        }}
        classroom={selectedClassroom}
        onConfirm={handleDeleteClassroom}
      />

      {/* Sub-modals for Members */}
      <AddMemberModal
        isOpen={memberModalMode === "add"}
        onClose={() => setMemberModalMode(null)}
        schoolId={school.school_id}
        schoolName={school.name}
        onSubmit={handleAddMember}
      />

      <EditMemberRoleModal
        isOpen={memberModalMode === "edit_role"}
        onClose={() => {
          setMemberModalMode(null);
          setSelectedMember(null);
        }}
        member={selectedMember}
        schoolName={school.name}
        onSubmit={handleUpdateMemberRole}
      />

      <RemoveMemberModal
        isOpen={memberModalMode === "remove"}
        onClose={() => {
          setMemberModalMode(null);
          setSelectedMember(null);
        }}
        member={selectedMember}
        schoolName={school.name}
        onConfirm={handleRemoveMember}
      />
    </>
  );
}

export default SchoolDetailModal;
