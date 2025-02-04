import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface ReviewStepProps {
  title: string;
  subtitle?: string;
  description?: string;
  options: string[];
  onConfirm: (choice: string) => void;
  onCancel: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  options,
  onConfirm,
  onCancel,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');

  return (
    <div className="w-full mx-auto">
      <div className="flex items-center gap-2 p-4 border-b">
        <Eye className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold">Review Needed</h2>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-base font-medium text-gray-500">Title</h3>
          <p className="text-sm text-gray-500">Choose the title</p>
        </div>

        <div className="space-y-3">
          <RadioGroup 
            onValueChange={setSelectedOption}
            className="space-y-2"
          >
            {options.map((option) => (
              <div 
                key={option} 
                className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <RadioGroupItem value={option} id={option} />
                <Label 
                  htmlFor={option} 
                  className="flex-1 cursor-pointer text-base"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="px-8"
        >
          Cancel Execution
        </Button>
        <Button 
          onClick={() => onConfirm(selectedOption)}
          disabled={!selectedOption}
          className="px-8 bg-blue-500 hover:bg-blue-600"
        >
          Accept Output
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep; 