import { useState, useEffect, useRef } from "react";
import {
  LuX,
  LuHeading2,
  LuHeading3,
  LuBold,
  LuItalic,
  LuList,
  LuListOrdered,
  LuLink,
  LuCode,
  LuEye,
  LuPencil as LuEdit3,
} from "react-icons/lu";

/**
 * TextBlockModal Component
 * เครื่องมือเขียนและจัดรูปแบบข้อความ (Text Content Editor)
 * รองรับ:
 * - Heading (H1, H2, H3)
 * - Paragraph
 * - Bold, Italic
 * - Bullet List, Numbered List
 * - Link
 * - Code & Inline Code
 * - Live Preview สลับดูตัวอย่างได้ทันที
 */
function TextBlockModal({
  isOpen,
  onClose,
  initialData = null,
  onSave,
}) {
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [previewTab, setPreviewTab] = useState("editor"); // 'editor' | 'preview'
  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content_data || "");
      setCaption(initialData.caption || "");
    } else {
      setContent("");
      setCaption("");
    }
    setPreviewTab("editor");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // ฟังก์ชันช่วยแทรก Markdown Syntax ลงในตำแหน่งเคอร์เซอร์
  const insertSyntax = (before, after = "", defaultText = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;

    const replacement = `${before}${selectedText}${after}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // ปรับตำแหน่งเคอร์เซอร์หลังแทรก
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 50);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("กรุณากรอกข้อความเนื้อหา");
      return;
    }

    onSave({
      content_type: "text",
      content_data: content.trim(),
      caption: caption.trim() || null,
    });
  };

  // เรนเดอร์ Preview อย่างง่ายสำหรับ Markdown เบื้องต้น
  const renderPreviewHtml = (rawText) => {
    if (!rawText) return "<p class='text-gray-400 italic'>ยังไม่มีข้อความเนื้อหา...</p>";

    // แปลง basic markdown เป็น HTML ปลอดภัย
    let html = rawText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^### (.*$)/gim, "<h3 class='text-lg font-bold text-[#004643] mt-3 mb-1'>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2 class='text-xl font-black text-[#26332F] mt-4 mb-2'>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1 class='text-2xl font-black text-[#26332F] mt-4 mb-2'>$1</h1>");

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Inline Code
    html = html.replace(/`(.*?)`/g, "<code class='rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-[#004643] border border-gray-200'>$1</code>");

    // Code Blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre class='rounded-xl bg-[#20302C] text-emerald-300 p-3.5 my-2 font-mono text-xs overflow-x-auto'><code>$1</code></pre>");

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-[#004643] underline font-bold'>$1</a>");

    // Lists
    html = html.replace(/^- (.*$)/gim, "<li class='ml-4 list-disc'>$1</li>");
    html = html.replace(/^\d+\. (.*$)/gim, "<li class='ml-4 list-decimal'>$1</li>");

    // Paragraphs / Newlines
    html = html.replace(/\n\n/g, "</p><p class='my-2 leading-relaxed'>");
    html = `<div class='space-y-2 leading-relaxed text-[#26332F] text-sm'>${html}</div>`;

    return html;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-fadeIn">
        {/* ส่วนหัว Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4 bg-[#FAFAFA]">
          <div>
            <h3 className="text-base font-black text-[#26332F]">
              {initialData ? "แก้ไขบล็อกข้อความ" : "เพิ่มเนื้อหาข้อความ (Text Content)"}
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              เขียนเนื้อหาบทเรียน รองรับการจัดรูปแบบตัวหนา ตัวเอียง รายการ หัวข้อ และโค้ด
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] hover:bg-gray-200 transition cursor-pointer"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* ฟอร์มและตัวแก้ไข */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* หัวข้อเนื้อหา (Caption / Title) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              หัวข้อของเนื้อหา (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เช่น เซนเซอร์คืออะไร? หรือ สรุปความสำคัญ"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* แถบสลับระหว่าง Editor และ Preview */}
          <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-2 pt-1">
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertSyntax("## ", "", "หัวข้อหลัก")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="หัวข้อ H2"
              >
                <LuHeading2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax("### ", "", "หัวข้อย่อย")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="หัวข้อย่อย H3"
              >
                <LuHeading3 className="h-4 w-4" />
              </button>
              <span className="h-4 w-[1px] bg-gray-300 mx-0.5" />
              <button
                type="button"
                onClick={() => insertSyntax("**", "**", "ข้อความตัวหนา")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="ตัวหนา"
              >
                <LuBold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax("*", "*", "ข้อความตัวเอียง")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="ตัวเอียง"
              >
                <LuItalic className="h-4 w-4" />
              </button>
              <span className="h-4 w-[1px] bg-gray-300 mx-0.5" />
              <button
                type="button"
                onClick={() => insertSyntax("\n- ", "", "รายการย่อย")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="รายการสัญลักษณ์"
              >
                <LuList className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax("\n1. ", "", "รายการลำดับ")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="รายการตัวเลข"
              >
                <LuListOrdered className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax("[", "](https://...)", "ข้อความลิงก์")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="แทรกลิงก์"
              >
                <LuLink className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => insertSyntax("`", "`", "inline_code")}
                className="rounded-lg p-1.5 text-[#26332F] hover:bg-[#ABD1C6]/30 transition"
                title="โค้ดในบรรทัด"
              >
                <LuCode className="h-4 w-4" />
              </button>
            </div>

            {/* ปุ่มสลับ Tab (แก้ไข / ดูตัวอย่าง) */}
            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewTab("editor")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  previewTab === "editor"
                    ? "bg-white text-[#26332F] shadow-xs"
                    : "text-[#6B7773] hover:text-[#26332F]"
                }`}
              >
                <LuEdit3 className="h-3.5 w-3.5" />
                <span>เขียน</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("preview")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                  previewTab === "preview"
                    ? "bg-white text-[#26332F] shadow-xs"
                    : "text-[#6B7773] hover:text-[#26332F]"
                }`}
              >
                <LuEye className="h-3.5 w-3.5" />
                <span>ตัวอย่าง</span>
              </button>
            </div>
          </div>

          {/* พื้นที่แก้ไขข้อความ หรือ แสดงตัวอย่าง */}
          {previewTab === "editor" ? (
            <textarea
              ref={textareaRef}
              rows={11}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนเนื้อหาของคุณที่นี่... สามารถใช้ Heading (###), ตัวหนา (**), หรือโค้ดตัวอย่างได้"
              className="w-full rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 text-sm font-sans text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition leading-relaxed shadow-inner resize-none"
            />
          ) : (
            <div className="min-h-[264px] rounded-2xl border border-[#E5E9E7] bg-white p-5 overflow-y-auto max-h-[350px]">
              {caption && (
                <h4 className="text-base font-bold text-[#004643] border-b border-gray-100 pb-2 mb-3">
                  {caption}
                </h4>
              )}
              <div
                dangerouslySetInnerHTML={{ __html: renderPreviewHtml(content) }}
              />
            </div>
          )}

          {/* ส่วนท้ายและปุ่มบันทึก */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E9E7]">
            <span className="text-xs text-[#6B7773]">
              จำนวนตัวอักษร: {content.length} ตัวอักษร
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#E5E9E7] bg-white px-5 py-2 text-xs font-bold text-[#26332F] hover:bg-gray-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#ABD1C6] px-6 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-sm"
              >
                บันทึกข้อความ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TextBlockModal;
