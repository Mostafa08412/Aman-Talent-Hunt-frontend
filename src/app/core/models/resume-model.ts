import { ResultWithData } from "./common";

export interface ResumeDownloadResult {
  stream?: string | null; // binary
  fileName?: string | null;
  contentType?: string | null;
}

export type ResumeDownloadResultResult =
  ResultWithData<ResumeDownloadResult>;

/** GET /api/candidate/resume/info — null data when the candidate has no resume. */
export interface ResumeInfoDto {
  id?: string | null;
  name?: string | null;
}

export type ResumeInfoResult = ResultWithData<ResumeInfoDto>;
