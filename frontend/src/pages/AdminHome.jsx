import Dashboard from "./admin/Dashboard";

/**
 * AdminHome Component (URL: /admin/home)
 * Proxies directly to the Super Admin Dashboard component
 * Preserves route stability and business logic while rendering the Jade theme dashboard
 */
function AdminHome() {
  return <Dashboard />;
}

export default AdminHome;
