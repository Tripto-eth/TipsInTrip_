import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const essentialsDirectory = path.join(process.cwd(), 'essentials');

export interface EssentialMeta {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  affiliateUrl?: string;
  price?: string;
  featured?: boolean;
  date?: string;
}

export function getSortedEssentialsData(): EssentialMeta[] {
  if (!fs.existsSync(essentialsDirectory)) return [];
  const fileNames = fs.readdirSync(essentialsDirectory).filter((f) => f.endsWith('.md'));
  const all = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');
    const fullPath = path.join(essentialsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    return { id, ...(matterResult.data as Omit<EssentialMeta, 'id'>) };
  });
  return all.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.title || '').localeCompare(b.title || '');
  });
}

export function getAllEssentialIds() {
  if (!fs.existsSync(essentialsDirectory)) return [];
  const fileNames = fs.readdirSync(essentialsDirectory).filter((f) => f.endsWith('.md'));
  return fileNames.map((fileName) => ({
    params: { slug: fileName.replace(/\.md$/, '') },
  }));
}

export async function getEssentialData(id: string) {
  const fullPath = path.join(essentialsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);
  const processedContent = await remark().use(html).process(matterResult.content);
  const contentHtml = processedContent.toString();
  return {
    id,
    contentHtml,
    ...(matterResult.data as Omit<EssentialMeta, 'id'>),
  };
}
