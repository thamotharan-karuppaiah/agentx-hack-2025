import { useReactFlow } from 'reactflow';
import { Code2, FileText, Globe, Wand2 } from 'lucide-react';
import { updateNodeData } from '../../../utils/flowUtils';

const OUTPUT_TYPES = [
  {
    id: 'autodetect',
    label: 'Autodetect',
    icon: Wand2,
  },
  {
    id: 'markdown',
    label: 'Markdown',
    icon: FileText,
  },
  {
    id: 'code',
    label: 'Code',
    icon: Code2,
  },
  {
    id: 'html',
    label: 'HTML',
    icon: Globe,
  },
];

interface OutputDetailProps {
  id: string;
  data: {
    outputType?: string;
  };
}

export const OutputDetail = ({ id, data }: OutputDetailProps) => {
  const { getNodes, setNodes } = useReactFlow();

  const handleOutputTypeChange = (type: string) => {
    const nodes = getNodes();
    updateNodeData(id, { outputType: type }, nodes, setNodes);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Render Output As</h3>
        <div className="grid grid-cols-2 gap-2">
          {OUTPUT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = data.outputType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOutputTypeChange(type.id);
                }}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border
                  ${isSelected 
                    ? 'border-gray-900 bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5 mb-2" />
                <span className="text-sm">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
