import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import { INFO_PAGES } from "./infoContent";

/**
 * InfoPage — หน้าเนื้อหาทั่วไปจากลิงก์ Footer (ข้อ 3)
 * page: "privacy" | "terms" | "help"
 */
function InfoPage({ page }) {
  const content = INFO_PAGES[page];
  if (!content) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004643] hover:underline"
      >
        <LuArrowLeft className="h-4 w-4" />
        กลับหน้าแรก
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[#26332F]">{content.title}</h1>
        <p className="text-sm text-[#6B7773]">{content.subtitle}</p>
      </header>

      <div className="space-y-5">
        {content.sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-3"
          >
            <h2 className="text-base font-bold text-[#26332F]">{section.heading}</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#26332F]/90 leading-relaxed">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export default InfoPage;
