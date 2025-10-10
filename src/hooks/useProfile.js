import { useProfile as useProfileContext } from "../contexts/ProfileContext";

export const useProfile = () => {
  return useProfileContext();
};

export const useProfileStudent = () => {
  const context = useProfileContext();
  if (context.userType !== "student") {
    throw new Error(
      'useProfileStudent phải được sử dụng trong một ProfileProvider với userType="student"'
    );
  }
  return context;
};

export const useProfileTeacher = () => {
  const context = useProfileContext();
  if (context.userType !== "teacher") {
    throw new Error(
      'useProfileTeacher phải được sử dụng trong một ProfileProvider với userType="teacher"'
    );
  }
  return context;
};
