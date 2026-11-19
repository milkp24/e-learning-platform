import Sidebar from "../../Sidebar";

/**
 * AdminSidebar Compatibility Wrapper
 * Forwards to the unified shared Sidebar component with role="admin"
 */
function AdminSidebar(props) {
  return <Sidebar role="admin" {...props} />;
}

export default AdminSidebar;
