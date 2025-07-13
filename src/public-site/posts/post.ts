import fs from 'fs';
import path from 'path';

export function getPostContent(slug: string) {
	const filePath = path.join(process.cwd(), 'posts', `${slug}.md`);
	return fs.readFileSync(filePath, 'utf8');
}
