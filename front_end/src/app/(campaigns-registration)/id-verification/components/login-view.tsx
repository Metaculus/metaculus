"use client";

import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";

const LoginView = () => {
  const { setCurrentModal } = useModal();

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-center text-sm">
        Log In first to verify your identity
      </p>
      <Button
        variant="primary"
        onClick={() => setCurrentModal({ type: "signin" })}
        className="mt-0"
      >
        Log In
      </Button>
    </div>
  );
};

export default LoginView;
