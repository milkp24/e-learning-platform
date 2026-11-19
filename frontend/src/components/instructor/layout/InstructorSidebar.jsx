import Sidebar from "../../Sidebar";

/**
 * InstructorSidebar Compatibility Wrapper
 * Forwards to the unified shared Sidebar component with role="instructor"
 */
function InstructorSidebar(props) {
  return <Sidebar role="instructor" {...props} />;
}

export default InstructorSidebar;
