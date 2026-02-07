import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const getAuth = async (req: Request) => {
  void req;
  // TODO: Replace with real auth lookup.
  return { userId: "anonymous" };
};

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await getAuth(req);
      if (!user?.userId) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete", { metadata, fileUrl: file.url });
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
