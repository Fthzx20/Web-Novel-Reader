"use client";

import { normalizeNodeId } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";

import { EditorKit } from "@/plate/components/editor/editor-kit";
import { SettingsDialog } from "@/plate/components/editor/settings-dialog";
import { Editor, EditorContainer, type EditorProps } from "@/plate/components/ui/editor";

export type PlateValue = unknown[];

export type PlateEditorProps = {
  value?: PlateValue;
  onChange?: (value: PlateValue) => void;
  variant?: EditorProps["variant"];
  containerClassName?: string;
};

const defaultValue = normalizeNodeId([
  {
    type: "p",
    children: [{ text: "" }],
  },
]);

export function PlateEditor({
  value = defaultValue,
  onChange,
  variant = "fullWidth",
  containerClassName,
}: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: EditorKit,
    value,
  });

  return (
    <Plate
      editor={editor}
      onChange={({ value: nextValue }) => {
        onChange?.(nextValue as PlateValue);
      }}
    >
      <EditorContainer className={containerClassName}>
        <Editor variant={variant} />
      </EditorContainer>
      <SettingsDialog />
    </Plate>
  );
}
