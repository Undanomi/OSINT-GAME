export interface EmailData {
  id: number;
  from: string;
  to?: string;
  subject: string;
  content: string;
  time: string;
  unread: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'trash';
  originalFolder?: 'inbox' | 'sent';
}