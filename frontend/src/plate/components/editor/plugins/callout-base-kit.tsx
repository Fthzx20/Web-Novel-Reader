import { BaseCalloutPlugin } from '@platejs/callout';

import { CalloutElementStatic } from '@/plate/components/ui/callout-node-static';

export const BaseCalloutKit = [
  BaseCalloutPlugin.withComponent(CalloutElementStatic),
];

