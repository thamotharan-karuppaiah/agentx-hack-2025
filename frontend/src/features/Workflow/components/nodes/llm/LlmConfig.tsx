import { Brain, FileText, HelpCircle, Cog, Plus, GripVertical, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfigComponentProps } from '../../../types';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const MODELS = [
  { id: 'gpt-4', label: 'GPT-4', icon: Brain },
  { id: 'gpt-4o', label: 'GPT-4o', icon: Brain },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', icon: Brain },
];

const OUTPUT_FORMATS = [
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'json', label: 'JSON', icon: FileText },
  { id: 'markdown', label: 'Markdown', icon: FileText },
];

interface Message {
  id: string;
  type: 'USER' | 'ASSISTANT';
  content: string;
}

export function LlmConfig({ data, onChange }: ConfigComponentProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [localTemp, setLocalTemp] = useState(data?.temperature ?? 0.7);
  const [messages, setMessages] = useState<Message[]>(data?.messages || []);

  const handleChange = (field: string) => (value: any) => {
    onChange({ [field]: value });
  };

  const debouncedTempChange = useDebouncedCallback(
    (value: number) => {
      onChange({ temperature: value });
    },
    500
  );

  const handleTempChange = (value: number[]) => {
    setLocalTemp(value[0]);
    debouncedTempChange(value[0]);
  };

  const toggleMessageType = (id: string) => {
    const newMessages = messages.map(msg => {
      if (msg.id === id) {
        const newType = msg.type === 'USER' ? 'ASSISTANT' : 'USER';
        return {
          ...msg,
          type: newType
        } as Message;
      }
      return msg;
    });
    setMessages(newMessages);
    onChange({ ...data, messages: newMessages });
  };

  const updateMessageContent = (id: string, content: string) => {
    const newMessages = messages.map(msg => {
      if (msg.id === id) {
        return { ...msg, content } as Message;
      }
      return msg;
    });
    setMessages(newMessages);
    onChange({ ...data, messages: newMessages });
  };

  const addMessage = () => {
    const lastMessage = messages[messages.length - 1];
    const newMessage: Message = {
      id: Date.now().toString(),
      type: lastMessage?.type === 'USER' ? 'ASSISTANT' : 'USER',
      content: ''
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    onChange({ ...data, messages: newMessages });
  };

  return (
    <div className="space-y-6">
      {/* LLM Settings Box */}
      <div className="border border-gray-200 rounded-lg">
        <div 
          className="flex items-center gap-4 px-4 h-10 cursor-pointer"
          onClick={() => setShowSettings(!showSettings)}
        >
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-gray-500" />
            <span className="text-[15px] font-medium text-gray-900">{data?.model || 'GPT-4o'}</span>
          </div>

          <div className="flex items-center divide-x divide-gray-200">
            <div className="flex items-center gap-1.5 px-4">
              <span className="text-gray-500">Format</span>
              <span className="text-gray-900">{data?.format || 'Text'}</span>
            </div>

            <div className="flex items-center gap-1.5 px-4">
              <span className="text-gray-500">Streaming</span>
              <span className="text-gray-900">{data?.streaming ? 'ON' : 'OFF'}</span>
            </div>

            <div className="flex items-center gap-1.5 px-4">
              <span className="text-gray-500">Temp</span>
              <span className="text-gray-900">{localTemp}</span>
            </div>

            <div className="flex items-center gap-1.5 px-4">
              <span className="text-gray-500">Max-Length</span>
              <span className="text-gray-900">{data?.maxLength || 'Auto-Max'}</span>
            </div>
          </div>

          <Cog className="h-4 w-4 text-gray-500 ml-auto" />
        </div>

        {showSettings && (
          <div className="p-6 space-y-6 border-t border-gray-200">
            <div>
              <h3 className="text-[15px] font-medium text-gray-700 mb-2">AI Model</h3>
              <Select
                defaultValue={data?.model || 'gpt-4o'}
                onValueChange={handleChange('model')}
              >
                <SelectTrigger className="bg-white">
                  <div className="flex items-center gap-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <model.icon className="h-4 w-4" />
                        <span>{model.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="text-[15px] font-medium text-gray-700 mb-2">AI Model Version</h3>
              <Select
                defaultValue={data?.version || 'auto'}
                onValueChange={handleChange('version')}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Auto-update to default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-update to default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-medium text-gray-700">Temperature (Model Creativity)</h3>
              </div>
              <div className="bg-white rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-gray-500">Predictable</span>
                  <Slider
                    defaultValue={[localTemp]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={handleTempChange}
                    className="flex-1"
                  />
                  <span className="text-[13px] text-gray-500">Creative</span>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[15px] font-medium">{localTemp}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-[15px] font-medium text-gray-700 mb-2">Max Output Length (optional)</h3>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={data?.maxLength || 'auto'}
                    onValueChange={handleChange('maxLength')}
                  >
                    <SelectTrigger className="bg-white flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-Max</SelectItem>
                      <SelectItem value="1000">1000</SelectItem>
                      <SelectItem value="2000">2000</SelectItem>
                      <SelectItem value="4000">4000</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-[15px] text-gray-500">Tokens</span>
                </div>
              </div>

              <div>
                <h3 className="text-[15px] font-medium text-gray-700 mb-2">Output Format</h3>
                <Select
                  defaultValue={data?.format || 'text'}
                  onValueChange={handleChange('format')}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_FORMATS.map(format => (
                      <SelectItem key={format.id} value={format.id}>
                        <div className="flex items-center gap-2">
                          <format.icon className="h-4 w-4" />
                          <span>{format.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  defaultChecked={data?.streaming ?? true}
                  onCheckedChange={handleChange('streaming')}
                  id="streaming"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="streaming" className="cursor-pointer text-[15px] text-gray-700">Enable Streaming</Label>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  defaultChecked={data?.consistent ?? false}
                  onCheckedChange={handleChange('consistent')}
                  id="consistent"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="consistent" className="cursor-pointer text-[15px] text-gray-700">Request Consistent Results</Label>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <h3 className="text-[15px] font-medium text-gray-900">System Prompt</h3>
        <Textarea
          defaultValue={data?.systemPrompt || ''}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          placeholder="Enter system prompt"
          className="min-h-[120px] text-[15px]"
        />
      </div>

      {/* Chat Messages */}
      <div className="space-y-2">
        <h3 className="text-[15px] font-medium text-gray-900">Chat</h3>
        <DragDropContext
          onDragEnd={(result) => {
            if (!result.destination) return;
            
            const newMessages = Array.from(messages);
            const [reorderedItem] = newMessages.splice(result.source.index, 1);
            newMessages.splice(result.destination.index, 0, reorderedItem);
            
            setMessages(newMessages);
            onChange({ ...data, messages: newMessages });
          }}
        >
          <Droppable droppableId="messages">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {messages.map((message, index) => (
                  <Draggable 
                    key={message.id} 
                    draggableId={message.id} 
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            {...provided.dragHandleProps}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <button
                            onClick={() => toggleMessageType(message.id)}
                            className="h-8 px-4 rounded bg-gray-100 hover:bg-gray-200 font-mono text-[13px] font-medium"
                          >
                            {message.type}
                          </button>
                          <Textarea
                            defaultValue={message.content}
                            onChange={(e) => updateMessageContent(message.id, e.target.value)}
                            placeholder={`${message.type.toLowerCase()} message ${index + 1}`}
                            className="min-h-[44px] resize-none text-[15px]"
                          />
                          <button
                            onClick={() => {
                              const newMessages = messages.filter(msg => msg.id !== message.id);
                              setMessages(newMessages);
                              onChange({ ...data, messages: newMessages });
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-[13px] font-medium"
          onClick={addMessage}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Message
        </Button>
      </div>
    </div>
  );
} 