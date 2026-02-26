import { useState } from "react";

export default function useAuthSubmit() {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (callback: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await callback();
    } catch (err) {
      console.error(err);
      alert("An error occurred during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleAuth };
}