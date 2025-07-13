import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';

export async function generateStaticParams() {
	const postsDir = path.join(process.cwd(), 'posts');
	const files = fs.readdirSync(postsDir);

	return files.map((filename) => ({
		slug: filename.replace(/\.md$/, ''),
	}));
}

function getPostContent(slug: string) {
	const filePath = path.join(process.cwd(), 'posts', `${slug}.md`);
	return fs.readFileSync(filePath, 'utf8');
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const content = getPostContent(slug);

	return (
		<div className="prose max-w-5xl mx-auto p-4 pt-10">
			<ReactMarkdown>{content}</ReactMarkdown>
		</div>
	);
}
