import { useRef, forwardRef } from 'react';
import AceEditor from 'react-ace';
import { config } from 'ace-builds';

// Import and configure workers
// @ts-ignore
import jsWorkerUrl from 'ace-builds/src-noconflict/worker-javascript?url';
config.setModuleUrl('ace/mode/javascript_worker', jsWorkerUrl);

// Import modes and addons
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-text';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

import { cn } from '@/lib/utils';

export type CAceEditorMode = 'javascript' | 'python' | 'text';

export interface CAceEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onValidate?: (annotations: any[]) => void;
  mode?: CAceEditorMode;
  className?: string;
  readOnly?: boolean;
  minLines?: number;
  maxLines?: number;
  showGutter?: boolean;
  highlightActiveLine?: boolean;
  showPrintMargin?: boolean;
  wrapEnabled?: boolean;
  fontSize?: number;
  tabSize?: number;
  enableBasicAutocompletion?: boolean;
  enableLiveAutocompletion?: boolean;
  enableSnippets?: boolean;
  placeholder?: string;
}

export const CAceEditor = forwardRef<AceEditor, CAceEditorProps>(({
  value,
  onChange,
  onValidate,
  mode = 'text',
  className,
  readOnly = false,
  minLines,
  maxLines,
  showGutter = true,
  highlightActiveLine = true,
  showPrintMargin = false,
  wrapEnabled = true,
  fontSize = 13,
  tabSize = 2,
  enableBasicAutocompletion = true,
  enableLiveAutocompletion = true,
  enableSnippets = true,
  placeholder
}, ref) => {
  const editorRef = useRef<AceEditor>(null);

  return (
    <div className="relative">
      <AceEditor
        ref={ref || editorRef}
        mode={mode}
        placeholder={placeholder}
        theme="github"
        value={value}
        onChange={onChange}
        onValidate={onValidate}
        name={`ace-editor-${Math.random()}`}
        editorProps={{
          $blockScrolling: true,
          $showGutterTooltips: true,
        }}
        setOptions={{
          showLineNumbers: showGutter,
          tabSize,
          minLines,
          maxLines,
          enableBasicAutocompletion,
          enableLiveAutocompletion,
          enableSnippets,
          showGutter,
          highlightActiveLine,
          showPrintMargin,
          useWorker: mode === 'javascript',
          tooltipFollowsMouse: true,
          readOnly,
          highlightGutterLine: !readOnly,
          selectionStyle: readOnly ? 'text' : 'line',
          behavioursEnabled: !readOnly,
          dragEnabled: !readOnly,
          showCursor: !readOnly
        }}
        width="100%"
        height="100%"
        className={cn(
          'rounded-md h-full',
          readOnly && 'ace-editor-readonly',
          className
        )}
        readOnly={readOnly}
        fontSize={fontSize}
        wrapEnabled={wrapEnabled}
      />
    </div>
  );
}); 