import { useEffect, useState } from "react";

/**
 * Hook để lắng nghe sự thay đổi của session storage giữa các tab
 * @param {string} key - Key cần lắng nghe
 * @param {any} defaultValue - Giá trị mặc định
 * @returns {[any, (value: any) => void]} - [value, setValue]
 */
export const useSessionStorage = (key, defaultValue = null) => {
  const [value, setValue] = useState(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Lỗi khi đọc session storage:", error);
      return defaultValue;
    }
  });

  const setStoredValue = (newValue) => {
    try {
      setValue(newValue);
      if (newValue === null) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(newValue));
      }
    } catch (error) {
      console.error("Lỗi khi ghi session storage:", error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== e.oldValue) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : null;
          setValue(newValue);
        } catch (error) {
          console.error("Lỗi khi parse session storage change:", error);
        }
      }
    };

    // Lắng nghe sự thay đổi của storage
    window.addEventListener("storage", handleStorageChange);

    // Lắng nghe sự thay đổi trong cùng tab
    const originalSetItem = sessionStorage.setItem;
    const originalRemoveItem = sessionStorage.removeItem;

    sessionStorage.setItem = function (keyName, keyValue) {
      const event = new Event("storage");
      event.key = keyName;
      event.newValue = keyValue;
      event.oldValue = sessionStorage.getItem(keyName);
      window.dispatchEvent(event);
      originalSetItem.apply(this, arguments);
    };

    sessionStorage.removeItem = function (keyName) {
      const event = new Event("storage");
      event.key = keyName;
      event.newValue = null;
      event.oldValue = sessionStorage.getItem(keyName);
      window.dispatchEvent(event);
      originalRemoveItem.apply(this, arguments);
    };

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      sessionStorage.setItem = originalSetItem;
      sessionStorage.removeItem = originalRemoveItem;
    };
  }, [key]);

  return [value, setStoredValue];
};

export default useSessionStorage;
