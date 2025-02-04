import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <Search size={180} strokeWidth={1.5} className="text-black" />
        </div>

        <h1 className="text-5xl font-bold mb-4">404 Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">
          The resource you're looking for doesn't exist
        </p>
        <Button
            onClick={() => navigate('/ws')}
            className=""
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound; 