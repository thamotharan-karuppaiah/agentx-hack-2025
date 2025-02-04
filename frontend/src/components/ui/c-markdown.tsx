import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Code, List, ListOrdered, Quote, Link as LinkIcon } from 'lucide-react';
import { Markdown } from 'tiptap-markdown';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from '@tiptap/extension-link'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface CMarkdownProps {
    value: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

const TEXT_STYLES = [
    { label: 'Paragraph', value: 'paragraph' },
    { label: 'Heading 1', value: 'h1' },
    { label: 'Heading 2', value: 'h2' },
    { label: 'Heading 3', value: 'h3' },
] as const;

const LinkPopover: React.FC<{ editor: any }> = ({ editor }) => {
    const [url, setUrl] = useState(editor?.getAttributes('link').href || '');

    const applyLink = () => {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setUrl('');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={editor?.isActive('link') ? 'bg-muted' : ''}
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3">
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    applyLink();
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeLink}
                            className="text-destructive hover:text-destructive"
                        >
                            Remove
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUrl(editor?.getAttributes('link').href || '')}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={applyLink}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const MarkdownToolbar: React.FC<{ editor: any }> = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const getCurrentTextStyle = () => {
        if (editor.isActive('heading', { level: 1 })) return 'h1';
        if (editor.isActive('heading', { level: 2 })) return 'h2';
        if (editor.isActive('heading', { level: 3 })) return 'h3';
        return 'paragraph';
    };

    const handleTextStyleChange = (value: string) => {
        if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else if (value.startsWith('h')) {
            const level = parseInt(value.charAt(1));
            editor.chain().focus().toggleHeading({ level }).run();
        }
    };

    return (
        <div className="border-b p-2 flex gap-1 items-center">
            <Select
                value={getCurrentTextStyle()}
                onValueChange={handleTextStyleChange}
            >
                <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {TEXT_STYLES.map(style => (
                        <SelectItem 
                            key={style.value} 
                            value={style.value}
                            className={
                                style.value === 'h1' ? 'text-2xl font-bold' :
                                style.value === 'h2' ? 'text-xl font-bold' :
                                style.value === 'h3' ? 'text-lg font-bold' :
                                ''
                            }
                        >
                            {style.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border mx-2" /> {/* Divider */}

            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-muted' : ''}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-muted' : ''}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-muted' : ''}
            >
                <Code className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive('blockquote') ? 'bg-muted' : ''}
            >
                <Quote className="h-4 w-4" />
            </Button>
            <LinkPopover editor={editor} />
        </div>
    );
};

const CMarkdown: React.FC<CMarkdownProps> = ({
    value,
    onChange,
    placeholder = 'Begin typing markdown here...'
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline hover:no-underline',
                },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            Markdown.configure({
                html: false,
                transformPastedText: true,
                transformCopiedText: true,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'min-h-full outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            const content = editor.storage.markdown.getMarkdown();
            onChange?.(content);
        },
    });

    return (
        <div className="rounded-lg border h-full flex flex-col">
            <MarkdownToolbar editor={editor} />
            <div className="flex-1 overflow-auto min-h-0 p-4">
                <EditorContent 
                    editor={editor} 
                    className="h-full [&_p]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_.is-editor-empty]:before:text-muted-foreground [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none"
                />
            </div>
        </div>
    );
};

export default CMarkdown; 