import { BaseTogglePlugin } from '@platejs/toggle';

import { ToggleElementStatic } from '@/plate/components/ui/toggle-node-static';

export const BaseToggleKit = [
  BaseTogglePlugin.withComponent(ToggleElementStatic),
];

