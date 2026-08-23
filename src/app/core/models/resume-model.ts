import { ResultWithData } from "./common";

export interface ResumeDownloadResult {
  stream?: string | null; // binary
  fileName?: string | null;
  contentType?: string | null;
}

export type ResumeDownloadResultResult =
  ResultWithData<ResumeDownloadResult>;
