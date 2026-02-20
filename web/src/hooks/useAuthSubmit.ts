import { useState } from "react";
import { useNavigate } from "react-router-dom";

const useAuthSubmit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (callback: () => Promise<void>) => {
    setIsLoading(true);

    try {
      await callback();
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleAuth };
};

export default useAuthSubmit;