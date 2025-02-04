import { useEffect, useState, useCallback, useRef } from 'react';
import AceEditor from 'react-ace';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ConfigComponentProps } from '../../../types';
import './CodeConfig.css';

// Import and configure workers
import { config } from 'ace-builds';
// @ts-ignore
import jsWorkerUrl from 'ace-builds/src-noconflict/worker-javascript?url';
config.setModuleUrl('ace/mode/javascript_worker', jsWorkerUrl);

// Import modes and addons
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

// Configure Ace
import ace from 'ace-builds';
ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict');
ace.config.set('modePath', '/node_modules/ace-builds/src-noconflict');
ace.config.set('themePath', '/node_modules/ace-builds/src-noconflict');
ace.config.set('workerPath', '/node_modules/ace-builds/src-noconflict');

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' }
];

interface CodeData {
    language: string;
    code: string;
    functionPreview?: string;
    annotations?: any[];
}

export const CodeConfig = ({ data, onChange }: ConfigComponentProps) => {
    const editorRef = useRef<AceEditor>(null);
    const [localData, setLocalData] = useState<CodeData>({
        language: data?.language || 'javascript',
        code: data?.code || '',
        functionPreview: data?.functionPreview || '',
        annotations: []
    });

    useEffect(() => {
        if (data) {
            setLocalData(prev => ({
                ...prev,
                language: data.language || 'javascript',
                code: data.code || '',
                functionPreview: data.functionPreview || '',
            }));
        }
    }, [data]);

    useEffect(() => {
        if (!editorRef.current) return;

        const editor = editorRef.current.editor;
        const handleGutterClick = (e: any) => {
            const target = e.domEvent.target;
            if (target.className.indexOf('ace_error') !== -1 || target.className.indexOf('ace_warning') !== -1) {
                const row = e.getDocumentPosition().row;
                const annotation = localData.annotations?.find(a => a.row === row);
                if (annotation) {
                    editor.execCommand('showGutterTooltip', `${annotation.type}: ${annotation.text}`);
                }
            }
        };

        // @ts-ignore - Ace editor types are incomplete
        editor.on('gutterclick', handleGutterClick);

        return () => {
            // @ts-ignore
            editor.off('gutterclick', handleGutterClick);
        };
    }, [localData.annotations]);

    const handleLanguageChange = (value: string) => {
        const newData = { 
            ...localData, 
            language: value,
            annotations: []
        };
        setLocalData(newData);
        onChange(newData);
    };

    const handleCodeChange = useCallback((value: string) => {
        const lines = value.split('\n');
        const functionPreview = lines[0].trim();

        const newData = { 
            ...localData, 
            code: value,
            functionPreview,
        };
        
        setLocalData(newData);
        onChange(newData);
    }, [localData, onChange]);

    const handleValidation = useCallback((annotations: any[]) => {
        setLocalData(prev => ({
            ...prev,
            annotations: annotations.filter(a => a.type === 'error')
        }));
    }, []);

    const hasError = (localData.annotations ?? []).length > 0;

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div className="space-y-2">
                <Label>Select Language</Label>
                <Select
                    value={localData.language}
                    onValueChange={handleLanguageChange}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 flex flex-col flex-1">
                <Label>Function</Label>
                <div className={`border flex-1 rounded-md ${hasError ? 'border-red-500' : ''}`}>
                    <AceEditor
                        ref={editorRef}
                        mode={localData.language}
                        theme="github"
                        onChange={handleCodeChange}
                        onValidate={handleValidation}
                        value={localData.code}
                        name={`code-editor-${localData.language}`}
                        editorProps={{
                            $blockScrolling: true,
                            $showGutterTooltips: true,
                        }}
                        setOptions={{
                            showLineNumbers: true,
                            tabSize: 2,
                            enableBasicAutocompletion: true,
                            enableLiveAutocompletion: true,
                            enableSnippets: true,
                            showGutter: true,
                            useWorker: true,
                            showPrintMargin: false,
                            highlightActiveLine: true,
                            highlightGutterLine: true,
                            fontSize: 14,
                            tooltipFollowsMouse: true,
                        }}
                        width="100%"
                        height="100%"
                        className="rounded-md h-full"
                        annotations={localData.annotations}
                        markers={localData.annotations?.map(a => ({
                            startRow: a.row,
                            startCol: 0,
                            endRow: a.row,
                            endCol: 1000,
                            className: 'error-marker',
                            type: 'fullLine',
                            inFront: false
                        }))}
                        wrapEnabled={true}
                    />
                </div>
            </div>
        </div>
    );
};
