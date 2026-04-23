import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const guidesDirectory = path.join(process.cwd(), 'guides');

export function getSortedGuidesData() {
  // Legge i nomi dei file sotto /guides
  const fileNames = fs.readdirSync(guidesDirectory);
  const allGuidesData = fileNames.map((fileName) => {
    // Rimuove ".md" dal nome del file per ottenere l'ID/Slug
    const id = fileName.replace(/\.md$/, '');

    // Legge il file markdown come stringa
    const fullPath = path.join(guidesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Usa gray-matter per analizzare i metadati (Frontmatter)
    const matterResult = matter(fileContents);

    // Combina i dati con l'ID
    return {
      id,
      ...(matterResult.data as {
        title: string;
        description?: string;
        coverImage?: string;
        images?: string[];
        price?: string;
        lingue?: string;
        tags?: string[];
      }),
    };
  });
  
  // Ordina le guide in ordine alfabetico per Nome (title) anziché per data
  return allGuidesData.sort((a, b) => {
    if (a.title < b.title) {
      return -1;
    } else if (a.title > b.title) {
      return 1;
    } else {
      return 0;
    }
  });
}

export function getAllGuideIds() {
  const fileNames = fs.readdirSync(guidesDirectory);

  return fileNames.map((fileName) => {
    return {
      params: {
        slug: fileName.replace(/\.md$/, ''),
      },
    };
  });
}

export async function getGuideData(slug: string) {
  const fullPath = path.join(guidesDirectory, `${slug}.md`);
  console.log("👉 NEXT.JS STA CERCANDO QUI:", fullPath);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Usa gray-matter per analizzare i metadati
  const matterResult = matter(fileContents);

  // Usa remark per convertire il markdown in HTML
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();
  



  // Combina i dati con lo slug e il contenuto HTML
  return {
    slug,
    contentHtml,
    ...(matterResult.data as { 
      title: string; 
      description?: string; 
      coverImage?: string;
      images?: string[];
      price?: string;
      lingue?: string;
    }),
  };
}