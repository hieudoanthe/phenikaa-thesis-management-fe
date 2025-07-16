import React, { useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import "../pages/admin-ui/static/css/style.css";

const AdminLayout = ({ children, welcomeText }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="dashboard-modern-layout">
      <Sidebar collapsed={collapsed} />
      <div className="dashboard-main">
        <Navbar
          onHamburgerClick={() => setCollapsed((c) => !c)}
          welcomeText={welcomeText}
        />
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
