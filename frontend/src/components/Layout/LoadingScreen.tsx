import { Loader2 } from "lucide-react";

const LoadingScreen: React.FC<{ message?: string }> = ({
  message = "Please wait...",
}) => {
  return (
    <div className="inset-0 flex items-center align-center justify-center bg-white bg-opacity-50 z-50 w-full h-full">
      <Loader2 className="animate-spin h-8 w-8 text-black" />
      <p className="text-black text-lg font-semibold">{message}</p>
    </div>
  );
};

export default LoadingScreen;
