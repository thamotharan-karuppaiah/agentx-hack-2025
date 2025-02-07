import { useWorkflow } from './WorkflowContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code2, Globe, Webhook, Copy, Terminal } from "lucide-react";
import { useParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const WorkflowIntegrate: React.FC = () => {
  const { workflowId } = useParams();
  const { workflow } = useWorkflow();
  const { toast } = useToast();

  if (!workflow) return null;

  const apiEndpoint = `http://localhost:8000/workflows/${workflowId}/sync`;
  
  const curlExample = `curl --location '${apiEndpoint}' \\
--header 'Content-Type: application/json' \\
--data '{
    "initial_inputs": {
        "input_field": "value"
    }
}'`;

  const pythonExample = `import requests
import json

url = "${apiEndpoint}"
payload = {
    "initial_inputs": {
        "input_field": "value"
    }
}

headers = {
    'Content-Type': 'application/json'
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`;

  const iframeExample = `<iframe
  src="${apiEndpoint}/embed"
  width="100%"
  height="600px"
  frameborder="0"
></iframe>`;

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: description,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Integrate Workflow</h2>
        <p className="text-sm text-gray-500">
          Multiple ways to integrate this workflow into your applications
        </p>
      </div>

      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api">
            <Code2 className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="embed">
            <Globe className="h-4 w-4 mr-2" />
            Embed
          </TabsTrigger>
          <TabsTrigger value="webhook">
            <Webhook className="h-4 w-4 mr-2" />
            Webhook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Integration</CardTitle>
              <CardDescription>
                Make HTTP requests to run this workflow programmatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Endpoint</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(apiEndpoint, "API endpoint copied")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Input value={apiEndpoint} readOnly />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">cURL</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(curlExample, "cURL command copied")}
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <code>{curlExample}</code>
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Python</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(pythonExample, "Python code copied")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <code>{pythonExample}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Workflow</CardTitle>
              <CardDescription>
                Embed this workflow directly in your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Iframe Code</label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(iframeExample, "Iframe code copied")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto">
                  <code>{iframeExample}</code>
                </pre>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Preview</h4>
                <div className="bg-slate-50 border rounded-lg p-4 h-[400px] flex items-center justify-center">
                  <p className="text-sm text-gray-500">Iframe preview will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Integration</CardTitle>
              <CardDescription>
                Configure webhooks to trigger this workflow automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <Webhook className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Webhook Coming Soon
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 max-w-sm">
                    Webhook integration is currently under development. Check back later for updates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowIntegrate; 