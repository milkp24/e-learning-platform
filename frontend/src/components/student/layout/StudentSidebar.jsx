import Sidebar from "../../Sidebar";

/**
 * StudentSidebar Compatibility Wrapper
 * Forwards to the unified shared Sidebar component with role="student"
 */
function StudentSidebar(props) {
  return <Sidebar role="student" {...props} />;
}

export default StudentSidebar;
