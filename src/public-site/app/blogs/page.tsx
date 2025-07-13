import Link from "next/link";

type BlogPost = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	publishedAt: string;
	updatedAt: string;
};

const blogs: BlogPost[] = [
	{
		id: "1",
		title: "How to write clean code? Notes on book - Clean Code",
		slug: "clean-code",
		summary: "I studied the book by Uncle Bob 'Clean Code: A Handbook of Agile Software Craftsmanship'. It has the short summarized notes on how to write clean code in chapters. It helped me to write a good code and understood that code should be understandable by readers.",
		publishedAt: "2025-07-10",
		updatedAt: "2025-07-10",
	},
];

export default function BlogsPage() {
	return (
		<div className="max-w-7xl mx-auto py-16">
			{/* Page Header */}
			<div className="mb-20">
				<h1 className="text-4xl font-bold text-center mb-8">View My Blogs</h1>
				<div className="flex justify-center">
					<input
						type="text"
						placeholder="Search bugs, topics, titles..."
						className="w-full md:w-2/3 px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring focus:border-primary"
					/>
				</div>
			</div>

			{/* Main Grid */}
			<div className="max-w-4xl flex flex-col justify-center mx-auto">
				{blogs.map((post, index) => (
					<Link key={index} href={`/blogs/${post.slug}`}>
						<div
							className="border-b border-gray-300 p-6 py-8 hover:shadow-md transition"
						>
							<h2 className="text-xl font-semibold mb-2">
								{post.title}
							</h2>
							<div className="text-xs text-gray-500 mb-4">
								Published: {new Date(post.publishedAt).toLocaleDateString()} ○ Updated:{" "}
								{new Date(post.updatedAt).toLocaleDateString()}
							</div>
							<p className="text-sm text-gray-600">{post.summary}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
