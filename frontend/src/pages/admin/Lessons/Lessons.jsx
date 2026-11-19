import { useState, useEffect } from "react";
import classroomService from "../../../services/classroomService";
import LessonsHeader from "./components/LessonsHeader";
import CourseSelectSection from "./components/CourseSelectSection";
import LessonsListSection from "./components/LessonsListSection";

/**
 * Lessons Page Component (Admin Lessons & Episodes Management)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * Hierarchy: Course -> Chapter / Lesson -> Episode -> Content
 */
function Lessons() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [lessons, setLessons] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const data = await classroomService.getClassrooms();
        const list = Array.isArray(data) ? data : data.classrooms || [];
        setCourses(list);
        if (list.length > 0) {
          const firstId = list[0].classroom_id || list[0].id;
          setSelectedCourseId(firstId);
        }
      } catch {
        setError("ไม่สามารถโหลดรายชื่อหลักสูตรได้");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const fetchLessons = async () => {
      setLoadingLessons(true);
      setError(null);
      try {
        const data = await classroomService.getLessons(selectedCourseId);
        setLessons(Array.isArray(data) ? data : data.lessons || []);
      } catch {
        setError("ไม่สามารถโหลดบทเรียนของหลักสูตรนี้ได้");
        setLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    };

    fetchLessons();
  }, [selectedCourseId]);

  const selectedCourse = courses.find(
    (c) => (c.classroom_id || c.id) === selectedCourseId
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <LessonsHeader />

      {/* 2. Course Selector Bar */}
      <CourseSelectSection
        courses={courses}
        selectedCourseId={selectedCourseId}
        onSelectCourse={setSelectedCourseId}
        loadingCourses={loadingCourses}
        lessonCount={lessons.length}
        selectedCourse={selectedCourse}
      />

      {/* 3. Lessons List Container */}
      <LessonsListSection
        lessons={lessons}
        loadingLessons={loadingLessons}
        error={error}
        selectedCourse={selectedCourse}
      />
    </div>
  );
}

export default Lessons;
