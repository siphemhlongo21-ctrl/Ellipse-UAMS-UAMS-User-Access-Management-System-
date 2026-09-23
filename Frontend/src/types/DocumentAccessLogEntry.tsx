export interface DocumentAccessLogEntry {
  id?: string;
  actorName?: string;
  action?: string;
  at?: string;
  user: string;
  role?: string;
//   action: "Viewed" | "Downloaded" | "Uploaded";
  date: string;
  time: string;
  document?: string;
}