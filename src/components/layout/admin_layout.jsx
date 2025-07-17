import React, { useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";
import "../../styles/pages/admin/style.css";
import PropTypes from "prop-types";

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

AdminLayout.propTypes = {
  children: PropTypes.node,
  welcomeText: PropTypes.string,
};

export default AdminLayout;
