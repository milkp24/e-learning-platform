import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuNotebookPen, LuPencil, LuTrash2, LuPlus, LuX } from "react-icons/lu";
import journalService from "../../../../services/journalService";
import { confirmDelete } from "../../../../store/useConfirmStore";
import { notify } from "../../../../store/useToastStore";
import formatThaiDateTime from "../../../../utils/formatThaiDateTime";

// ======================================================
// LessonNotesPanel — บันทึกการเรียนรู้ของบทนี้ (ข้อ 27)
// เขียน/แก้/ลบโน้ตได้จากหน้าบทเรียนเลย โน้ตผูกกับบทเรียนและคอร์สอัตโนมัติ
// เห็นเฉพาะโน้ตของตัวเอง (Backend กรองตามผู้ใช้)
// ======================================================

const inputClass =
  "w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none";

function LessonNotesPanel({ lessonId, classroomId, lessonTitle }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | journal_id
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await journalService.getJournals({ lesson_id: lessonId });
      setNotes(data.journals || []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing("new");
    setTitle(lessonTitle ? `บันทึก: ${lessonTitle}` : "");
    setContent("");
  };

  const openEdit = (note) => {
    setEditing(note.journal_id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      notify.error("กรุณากรอกหัวข้อและเนื้อหาบันทึก");
      return;
    }
    setSaving(true);
    try {
      if (editing === "new") {
        await journalService.createJournal({
          title: title.trim(),
          content: content.trim(),
          classroom_id: classroomId,
          lesson_id: lessonId,
        });
        notify.success("บันทึกการเรียนรู้แล้ว");
      } else {
        await journalService.updateJournal(editing, { title: title.trim(), content: content.trim() });
        notify.success("แก้ไขบันทึกแล้ว");
      }
      setEditing(null);
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note) => {
    if (!(await confirmDelete({ itemType: "บันทึกการเรียนรู้", itemName: note.title }))) return;
    try {
      await journalService.deleteJournal(note.journal_id);
      notify.success(`ลบบันทึก "${note.title}" แล้ว`);
      load();
    } catch (err) {
      notify.error(err.response?.data?.message || "ลบบันทึกไม่สำเร็จ");
    }
  };

  return (
    <section className="rounded-2xl border border-[#E5E9E7] bg-white p-5 shadow-2xs space-y-4" aria-label="บันทึกการเรียนรู้ของบทนี้">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LuNotebookPen className="h-5 w-5 text-[#004643]" aria-hidden="true" />
          <h3 className="text-base font-bold text-[#26332F]">บันทึกการเรียนรู้ของบทนี้</h3>
          <span className="rounded-full bg-[#ABD1C6]/30 px-2 py-0.5 text-[11px] font-bold text-[#004643]">
            {notes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/journals?course=${classroomId}`} className="text-xs font-semibold text-[#004643] hover:underline">
            ดูบันทึกทั้งหมด
          </Link>
          {editing === null && (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1 rounded-xl bg-[#ABD1C6] px-3 py-1.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] transition cursor-pointer"
            >
              <LuPlus className="h-3.5 w-3.5" aria-hidden="true" />
              เขียนบันทึก
            </button>
          )}
        </div>
      </div>

      {editing !== null && (
        <form onSubmit={handleSave} className="space-y-2 rounded-xl border border-[#ABD1C6] bg-[#ABD1C6]/10 p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="หัวข้อบันทึก"
            aria-label="หัวข้อบันทึก"
            className={inputClass}
          />
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="สิ่งที่ได้เรียนรู้ในบทนี้..."
            aria-label="เนื้อหาบันทึก"
            className={`${inputClass} resize-y`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex items-center gap-1 rounded-xl border border-[#E5E9E7] bg-white px-3 py-1.5 text-xs font-bold text-[#26332F] hover:bg-gray-50 cursor-pointer"
            >
              <LuX className="h-3.5 w-3.5" aria-hidden="true" />
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#004643] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#003835] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-[#6B7773]">กำลังโหลดบันทึก...</p>
      ) : notes.length === 0 ? (
        editing === null && (
          <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-[#6B7773]">
            ยังไม่มีบันทึกในบทนี้ จดสิ่งที่ได้เรียนรู้ไว้ทบทวนภายหลังได้
          </p>
        )
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.journal_id} className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#26332F] break-words">{note.title}</p>
                  <p className="text-[11px] text-[#6B7773]">{formatThaiDateTime(note.updated_at || note.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(note)}
                    aria-label={`แก้ไขบันทึก ${note.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E9E7] bg-white text-[#004643] hover:bg-[#ABD1C6]/20 cursor-pointer"
                  >
                    <LuPencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    aria-label={`ลบบันทึก ${note.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E9E7] bg-white text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-xs text-[#26332F]">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default LessonNotesPanel;
