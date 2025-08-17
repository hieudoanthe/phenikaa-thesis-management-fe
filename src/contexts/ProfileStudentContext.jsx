import React, { createContext, useContext, useState, useEffect } from "react";
import userService from "../services/user.service";
import { getToken } from "../auth/authUtils";

// Tạo context cho Student Profile
const ProfileStudentContext = createContext();

// Hook để sử dụng context
export const useProfileStudent = () => {
  const context = useContext(ProfileStudentContext);
  if (!context) {
    throw new Error(
      "useProfileStudent phải được sử dụng trong ProfileStudentProvider"
    );
  }
  return context;
};

// Provider component
export const ProfileStudentProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    fullName: "",
    phoneNumber: "",
    major: "",
    className: "",
    avt: "",
    status: 1,
    studentId: "",
    email: "",
    dateOfBirth: "",
    address: "",
    gpa: 0,
    creditsCompleted: 0,
    totalCredits: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy userId từ access token
  const getUserIdFromToken = () => {
    try {
      const token = getToken();
      if (!token) return null;

      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || null;
    } catch (error) {
      console.error("Lỗi khi decode token:", error);
      return null;
    }
  };

  // Fetch profile data từ API
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = getUserIdFromToken();
      if (!userId) {
        throw new Error("Không thể lấy userId từ token");
      }

      const response = await userService.getStudentProfile(userId);
      const responseData = response?.data || response;

      if (responseData) {
        const profileData = {
          fullName: responseData.fullName || "",
          phoneNumber: responseData.phoneNumber || "",
          status: responseData.status || 1,
          major: responseData.major || "",
          className: responseData.className || "",
          avt: responseData.avt || "",
          studentId: responseData.userId?.toString() || "",
          email: responseData.email || "",
          dateOfBirth: responseData.dateOfBirth || "",
          address: responseData.address || "",
          gpa: responseData.gpa || 0,
          creditsCompleted: responseData.creditsCompleted || 0,
          totalCredits: responseData.totalCredits || 0,
        };

        setProfileData(profileData);
      }
    } catch (error) {
      console.error("Lỗi khi fetch profile data:", error);
      setError("Không thể tải thông tin profile. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật profile data
  const updateProfileData = (newData) => {
    setProfileData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  // Load profile data khi component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const value = {
    profileData,
    isLoading,
    error,
    fetchProfileData,
    updateProfileData,
  };

  return (
    <ProfileStudentContext.Provider value={value}>
      {children}
    </ProfileStudentContext.Provider>
  );
};
