import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface Message {
  id: string;
  type: 'USER' | 'ASSISTANT';
  content: string;
}

interface ChatConfigProps {
  messages: Message[];
  onChange: (messages: Message[]) => void;
}

export function ChatConfig({ messages: initialMessages = [], onChange }: ChatConfigProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

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
    onChange(newMessages);
  };

  const updateMessageContent = (id: string, content: string) => {
    const newMessages = messages.map(msg => {
      if (msg.id === id) {
        return { ...msg, content } as Message;
      }
      return msg;
    });
    setMessages(newMessages);
    onChange(newMessages);
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
    onChange(newMessages);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <button
              onClick={() => toggleMessageType(message.id)}
              className="flex-shrink-0 h-8 px-4 rounded bg-gray-100 hover:bg-gray-200 font-mono text-[13px] font-medium"
            >
              {message.type}
            </button>
            <Textarea
              value={message.content}
              onChange={(e) => updateMessageContent(message.id, e.target.value)}
              placeholder={`${message.type.toLowerCase()} message ${messages.indexOf(message) + 1}`}
              className="min-h-[44px] resize-none text-[15px]"
            />
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="bg-white text-[13px] font-medium"
            onClick={addMessage}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Message
          </Button>
        </div>
      </div>
    </div>
  );
} 