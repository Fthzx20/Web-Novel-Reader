import { BaseCommentPlugin } from '@platejs/comment';

import { CommentLeafStatic } from '@/plate/components/ui/comment-node-static';

export const BaseCommentKit = [
  BaseCommentPlugin.withComponent(CommentLeafStatic),
];

