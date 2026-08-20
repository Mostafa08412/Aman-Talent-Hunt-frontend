export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  description?: string;
  isActivelyHiring?: boolean;
  isFeatured?: boolean;
}
