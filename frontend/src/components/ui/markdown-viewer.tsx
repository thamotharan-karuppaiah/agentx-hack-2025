import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useEffect } from 'react';
import { Markdown } from 'tiptap-markdown';

const lowlight = createLowlight(common);

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: false,
      }),
    ],
    editable: false,
  });

  useEffect(() => {
    if (editor) {
      // Set content as markdown
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
} 