import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Editor, Extension, Node } from '@tiptap/core';

interface AgentInstructionsProps {
  form: UseFormReturn<any>;
}

// Mock tools data
const mockTools = [
  { id: 'google-search', name: 'Google Search' },
  { id: 'tone-format', name: 'Change Tone and Format' },
  { id: 'hubspot-notes', name: 'Create HubSpot Notes' },
  { id: 'extract-content', name: 'Extract Website Content' },
];

const ToolSuggestion = ({
  items,
  command,
}: {
  items: typeof mockTools;
  command: (tool: { id: string; name: string }) => void;
}) => {
  return (
    <div className="bg-popover text-popover-foreground rounded-md border shadow-md p-1 space-y-1 overflow-hidden pointer-events-auto">
      <div className="text-xs font-medium px-2 py-1.5 text-muted-foreground">
        Tools
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onMouseDown={(e) => {
            e.preventDefault();
            command(item);
          }}
          className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          {item.name}
        </button>
      ))}
    </div>
  );
};

// Add this custom node for tools
const ToolNode = Node.create({
  name: 'tool',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      name: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="tool"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          if (!(node instanceof HTMLElement)) return {};
          
          return {
            id: node.getAttribute('data-id'),
            name: node.textContent,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'span',
      {
        'data-type': 'tool',
        'data-id': node.attrs.id,
        'contenteditable': 'false',
        class: 'bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-sm inline-block',
      },
      node.attrs.name,
    ];
  },

  toText({ node }: { node: any }) {
    return `{{tool:${node.attrs.id}:${node.attrs.name}}}`;
  },
});

// Update the suggestion command
const suggestion = {
  items: ({ query }: { query: string }) => {
    return mockTools.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer | null = null;
    let popup: any | null = null;

    return {
      onStart: (props: { editor: Editor; clientRect: ClientRect }) => {
        component = new ReactRenderer(ToolSuggestion, {
          props: {
            ...props,
            command: (item: { id: string; name: string }) => {
              // remove previos charecter form current cursor postion 
              props.editor
                .chain()
                .focus()
                .deleteRange({ from: props.editor.state.selection.from - 1, to: props.editor.state.selection.from })
                .run();

              props.editor
                .chain()
                .focus()
                .insertContent({
                  type: 'tool',
                  attrs: {
                    id: item.id,
                    name: item.name,
                  },
                })
                .insertContent(' ')
                .run();
              
              popup?.[0].hide();
            },
          },
          editor: props.editor,
        });

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as any,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          zIndex: 9999,
          popperOptions: {
            strategy: 'fixed',
          },
        });
      },

      onUpdate(props: any) {
        component?.updateProps(props);

        popup?.[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup?.[0].hide();
          return true;
        }

        // @ts-ignore - TipTap types are incomplete
        return component?.ref?.onKeyDown?.(props) || false;
      },

      onExit() {
        popup?.[0].destroy();
        component?.destroy();
      },
    };
  },
};

const SuggestionExtension = Extension.create({
  name: 'suggestion',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        char: '/',
        items: suggestion.items,
        render: suggestion.render as any,
        editor: this.editor,
      }),
    ];
  },
});

export default function AgentInstructions({ form }: AgentInstructionsProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ToolNode,
      SuggestionExtension,
    ],
    content: '', // Start with empty content
    onUpdate: ({ editor }) => {
      const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', (node) => {
        if (node.type.name === 'tool') {
          return `{{tool:${node.attrs.id}:${node.attrs.name}}}`;
        }
        return '';
      });
      
      form.setValue('systemPrompt', text);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px]',
      },
    },
  });

  // Modified loading logic
  React.useEffect(() => {
    if (editor && form.getValues('systemPrompt')) {
      try {
        const savedContent = form.getValues('systemPrompt');
        const htmlContent = savedContent
          .split(/\n/)
          .map((line: string) => {
            const processedLine = line.replace(
              /{{tool:([^:]+):([^}]+)}}/g,
              (_: any, id: string, name: string) => 
                `<span data-type="tool" data-id="${id}" contenteditable="false">${name}</span>`
            );
            return `<p>${processedLine}</p>`;
          })
          .join('');

        editor.commands.setContent(htmlContent || '<p></p>');
      } catch (error) {
        console.error('Error loading content:', error);
        editor.commands.setContent('<p></p>');
      }
    }
  }, [editor, form]);

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Agent instructions</h2>
        <p className="text-sm text-muted-foreground">
          Describe how your agent should work. Type "/" to add tools. It's recommended to provide examples of tasks it might receive and what to do.
        </p>
      </div>

      <FormField
        control={form.control}
        name="instructions"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="min-h-[400px] border rounded-md p-4">
                <EditorContent editor={editor} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 