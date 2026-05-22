export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string; // Theme color name or hex
  createdAt: number; // Timestamp
  isPinned: boolean;
}
