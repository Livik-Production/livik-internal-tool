import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./s3";

export const getSignedResumeUrl = async (resumeKey: string): Promise<string> => {
  if (!resumeKey) return "";

  let key = resumeKey;

  // If it's a full URL, check if it's an S3 URL and extract the key.
  // Otherwise, return it directly (e.g. legacy vercel blob urls).
  if (resumeKey.startsWith("http://") || resumeKey.startsWith("https://")) {
    try {
      const url = new URL(resumeKey);
      if (url.hostname.includes("s3.amazonaws.com") || url.hostname.includes(".s3.")) {
        key = decodeURIComponent(url.pathname.substring(1));
      } else {
        return resumeKey;
      }
    } catch (e) {
      return resumeKey;
    }
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const signedUrl = await getSignedUrl(
    s3,
    command,
    {
      expiresIn: 60 * 5, // 5 minutes
    }
  );

  return signedUrl;
};
