import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "N/A";
  
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return "N/A";
  
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const getStatusColor = (status: string): { bgColor: string; textColor: string } => {
  const statusMap: Record<string, { bgColor: string; textColor: string }> = {
    approved: { bgColor: 'bg-green-100', textColor: 'text-green-800' },
    active: { bgColor: 'bg-green-100', textColor: 'text-green-800' },
    completed: { bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'in review': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    'in progress': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    pending: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    draft: { bgColor: 'bg-red-100', textColor: 'text-red-800' },
    rejected: { bgColor: 'bg-red-100', textColor: 'text-red-800' },
    obsolete: { bgColor: 'bg-neutral-100', textColor: 'text-neutral-800' },
  };

  const normalizedStatus = status.toLowerCase();
  return statusMap[normalizedStatus] || { bgColor: 'bg-neutral-100', textColor: 'text-neutral-800' };
};

export const getDocumentTypeColor = (type: string): { bgColor: string; textColor: string } => {
  const typeMap: Record<string, { bgColor: string; textColor: string }> = {
    sop: { bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'work instruction': { bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    form: { bgColor: 'bg-green-100', textColor: 'text-green-800' },
    record: { bgColor: 'bg-neutral-100', textColor: 'text-neutral-800' },
    policy: { bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
    manual: { bgColor: 'bg-pink-100', textColor: 'text-pink-800' },
    template: { bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
    report: { bgColor: 'bg-teal-100', textColor: 'text-teal-800' },
  };

  const normalizedType = type.toLowerCase();
  return typeMap[normalizedType] || { bgColor: 'bg-neutral-100', textColor: 'text-neutral-800' };
};

export const getTimeAgo = (timestamp: string | Date): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return "1 year ago";
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return "1 month ago";
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return "1 day ago";
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return "1 hour ago";
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return "1 minute ago";
  
  if (seconds < 10) return "just now";
  
  return `${Math.floor(seconds)} seconds ago`;
};

export const generateDocumentId = (type: string, counter: number): string => {
  const prefix = type.substring(0, 3).toUpperCase();
  const paddedCounter = String(counter).padStart(3, '0');
  return `${prefix}-${paddedCounter}`;
};
