import { ConfigComponentProps } from '../../../types';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CAceEditor } from '@/components/ui/c-ace-editor';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function ApiConfig({ data, onChange }: ConfigComponentProps) {
  const [localUrl, setLocalUrl] = useState(data?.url || '');

  const handleMethodChange = (method: string) => {
    onChange({ ...data, method });
  };

  const handleUrlChange = useDebouncedCallback((url: string) => {
    onChange({ ...data, url });
  }, 500);

  const handleHeadersChange = useDebouncedCallback((headers: string) => {
    onChange({ ...data, headers });
  }, 500);

  const handleBodyChange = useDebouncedCallback((body: string) => {
    onChange({ ...data, body });
  }, 500);

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue={data?.method?.toLowerCase() || 'get'} 
        onValueChange={handleMethodChange}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger onClick={() => handleMethodChange('get')} value="get">GET</TabsTrigger>
          <TabsTrigger onClick={() => handleMethodChange('post')} value="post">POST</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>URL</Label>
          <Input
            value={localUrl}
            onChange={(e) => {
              setLocalUrl(e.target.value);
              handleUrlChange(e.target.value);
            }}
            placeholder="https://api.example.com/endpoint"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Headers
            <span className="text-sm text-gray-500">(Optional)</span>
          </Label>
          <div>
            <CAceEditor
              defaultValue={data?.headers || ''}
              mode="text"
              onChange={handleHeadersChange}
              minLines={10}
              maxLines={10}
              showGutter={false}
              className="border rounded-md bg-white"
              placeholder="{ ... }"
              wrapEnabled
              showPrintMargin={false}
              highlightActiveLine={false}
            />
          </div>
        </div>

        {data?.method?.toLowerCase() === 'post' && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Body
              <span className="text-sm text-gray-500">(Optional)</span>
            </Label>
            <div>
              <CAceEditor
                defaultValue={data?.body || ''}
                mode="text"
                onChange={handleBodyChange}
                minLines={10}
                maxLines={10}
                showGutter={false}
                className="border rounded-md bg-white"
                placeholder="{ ... }"
                wrapEnabled
                showPrintMargin={false}
                highlightActiveLine={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
