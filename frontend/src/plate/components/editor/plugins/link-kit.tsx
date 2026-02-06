'use client';

import { LinkPlugin } from '@platejs/link/react';

import { LinkElement } from '@/plate/components/ui/link-node';
import { LinkFloatingToolbar } from '@/plate/components/ui/link-toolbar';

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];

