'use client';

import { TrailingBlockPlugin, type Value } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { AIKit } from '@/plate/components/editor/plugins/ai-kit';
import { AlignKit } from '@/plate/components/editor/plugins/align-kit';
import { AutoformatKit } from '@/plate/components/editor/plugins/autoformat-kit';
import { BasicBlocksKit } from '@/plate/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/plate/components/editor/plugins/basic-marks-kit';
import { BlockMenuKit } from '@/plate/components/editor/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '@/plate/components/editor/plugins/block-placeholder-kit';
import { CalloutKit } from '@/plate/components/editor/plugins/callout-kit';
import { CodeBlockKit } from '@/plate/components/editor/plugins/code-block-kit';
import { ColumnKit } from '@/plate/components/editor/plugins/column-kit';
import { CommentKit } from '@/plate/components/editor/plugins/comment-kit';
import { CopilotKit } from '@/plate/components/editor/plugins/copilot-kit';
import { CursorOverlayKit } from '@/plate/components/editor/plugins/cursor-overlay-kit';
import { DateKit } from '@/plate/components/editor/plugins/date-kit';
import { DiscussionKit } from '@/plate/components/editor/plugins/discussion-kit';
import { DndKit } from '@/plate/components/editor/plugins/dnd-kit';
import { DocxKit } from '@/plate/components/editor/plugins/docx-kit';
import { EmojiKit } from '@/plate/components/editor/plugins/emoji-kit';
import { ExitBreakKit } from '@/plate/components/editor/plugins/exit-break-kit';
import { FixedToolbarKit } from '@/plate/components/editor/plugins/fixed-toolbar-kit';
import { FloatingToolbarKit } from '@/plate/components/editor/plugins/floating-toolbar-kit';
import { FontKit } from '@/plate/components/editor/plugins/font-kit';
import { LineHeightKit } from '@/plate/components/editor/plugins/line-height-kit';
import { LinkKit } from '@/plate/components/editor/plugins/link-kit';
import { ListKit } from '@/plate/components/editor/plugins/list-kit';
import { MarkdownKit } from '@/plate/components/editor/plugins/markdown-kit';
import { MathKit } from '@/plate/components/editor/plugins/math-kit';
import { MediaKit } from '@/plate/components/editor/plugins/media-kit';
import { MentionKit } from '@/plate/components/editor/plugins/mention-kit';
import { SlashKit } from '@/plate/components/editor/plugins/slash-kit';
import { SuggestionKit } from '@/plate/components/editor/plugins/suggestion-kit';
import { TableKit } from '@/plate/components/editor/plugins/table-kit';
import { TocKit } from '@/plate/components/editor/plugins/toc-kit';
import { ToggleKit } from '@/plate/components/editor/plugins/toggle-kit';

export const EditorKit = [
  ...CopilotKit,
  ...AIKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Collaboration
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
];

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();

