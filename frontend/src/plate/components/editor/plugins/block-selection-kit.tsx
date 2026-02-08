'use client';

import { AIChatPlugin } from '@platejs/ai/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import {
  getPluginTypes,
  isHotkey,
  KEYS,
  type SlateEditor,
  type TElement,
} from 'platejs';
import { BlockSelection } from '@/plate/components/ui/block-selection';

const BlockSelectionPluginAny = BlockSelectionPlugin as unknown as {
  configure: (fn: (ctx: any) => any) => any;
};

export const BlockSelectionKit = [
  BlockSelectionPluginAny.configure(({ editor }: any) => ({
    options: {
      enableContextMenu: true,
      isSelectable: (element: TElement) =>
        !getPluginTypes(editor, [KEYS.column, KEYS.codeLine, KEYS.td]).includes(
          element.type
        ),
      onKeyDownSelecting: (editor: SlateEditor, e: KeyboardEvent) => {
        if (isHotkey('mod+j')(e)) {
          editor.getApi(AIChatPlugin).aiChat.show();
        }
      },
    },
    render: {
      belowRootNodes: BlockSelection as any,
    },
  })),
];

