import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GuestLockModal from "../../../components/GuestLockModal";
import useAuthStore from "../../../store/useAuthStore";
import HeroSection from "./components/HeroSection";
import RecommendedCoursesSection from "./components/RecommendedCoursesSection";
import LearningCategoriesSection from "./components/LearningCategoriesSection";
import WhyLearnSection from "./components/WhyLearnSection";
import LearningExperienceSection from "./components/LearningExperienceSection";
import CTASection from "./components/CTASection";

// ======================================================
// Home Component (Redesigned Guest Home - Professional E-learning Platform)
// ======================================================
// ลำดับ Section ตามข้อกำหนด:
// 1. Hero Section (Main Message, CTA, Learning Journey Visual)
// 2. Recommended / Course Preview (คอร์สจริงจากฐานข้อมูล 100%)
// 3. Learning Categories (หมวดหมู่การเรียนรู้)
// 4. Why Learn With Us (ทำไมต้องเรียนกับ E-learning Platform - 4 ด้าน)
// 5. Learning Experience (ประสบการณ์การเรียนรู้ 5 ขั้น)
// 6. CTA Section (พร้อมเริ่มพัฒนาทักษะของคุณแล้วหรือยัง?)
// (Header และ Footer ถูกเรนเดอร์ใน GuestLayout)
// ======================================================

function Home() {
  const { isAuthenticated, hasRole } = useAuthStore();
  const navigate = useNavigate();

  // หากผู้ใช้ Login เป็น Student อยู่แล้ว ให้นำทางไปยัง /student/home อัตโนมัติ
  useEffect(() => {
    if (isAuthenticated && hasRole("student")) {
      navigate("/student/home", { replace: true });
    }
  }, [isAuthenticated, hasRole, navigate]);

  // State สำหรับควบคุม GuestLockModal
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "ฟังก์ชันนี้สำหรับสมาชิก",
    message: "กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อนใช้งาน",
    badge: "สำหรับสมาชิกเท่านั้น",
  });

  const openLockModal = (featureName = "คอร์สเรียน") => {
    setModalState({
      isOpen: true,
      title: `ฟังก์ชัน ${featureName} สำหรับสมาชิก`,
      message:
        "สมัครสมาชิกฟรีเพื่อเข้าถึงบทเรียนทั้งหมด ฝึกปฏิบัติจริง และเริ่มพัฒนาทักษะของคุณ",
      badge: "สำหรับสมาชิกเท่านั้น",
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Recommended / Course Preview (ดึงคอร์สจริงจากฐานข้อมูลเท่านั้น) */}
      <RecommendedCoursesSection />

      {/* 3. Learning Categories Section (#learning-categories) */}
      <LearningCategoriesSection />

      {/* 4. Why Learn With Us Section (#why-us) */}
      <WhyLearnSection onOpenLockModal={openLockModal} />

      {/* 5. Learning Experience Section (#learning-experience) */}
      <LearningExperienceSection />

      {/* 6. CTA Section */}
      <CTASection />

      {/* Modal แจ้งเตือนสิทธิ์ Guest */}
      <GuestLockModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        badge={modalState.badge}
      />
    </div>
  );
}

export default Home;
