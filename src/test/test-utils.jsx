import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ProfileProvider } from "../contexts/ProfileContext";
import { NotificationProvider } from "../contexts/NotificationContext";

// Mock providers for testing
const MockProviders = ({ children, userType = "student" }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider userType={userType}>
          <NotificationProvider>{children}</NotificationProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function that includes providers
const customRender = (ui, options = {}) => {
  const { userType, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <MockProviders userType={userType}>{children}</MockProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
export { MockProviders };
