// app/blogs/page.tsx (or pages/blogs.tsx)
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
		title: "Fixing a Persistent React Re-render Bug",
		slug: "react-rerender-bug",
		summary: "How I solved a sneaky performance issue caused by unstable props.",
		publishedAt: "2025-06-12",
		updatedAt: "2025-06-18",
	},
	{
		id: "2",
		title: "Docker Compose Won’t Build: Troubleshooting Guide",
		slug: "docker-compose-fail",
		summary: "Diagnosing subtle YAML formatting errors in multi-service setups.",
		publishedAt: "2025-06-01",
		updatedAt: "2025-06-15",
	},
	{
		id: "2",
		title: "Docker Compose Won’t Build: Troubleshooting Guide",
		slug: "docker-compose-fail",
		summary: "Diagnosing subtle YAML formatting errors in multi-service setups.",
		publishedAt: "2025-06-01",
		updatedAt: "2025-06-15",
	},
	{
		id: "2",
		title: "Docker Compose Won’t Build: Troubleshooting Guide",
		slug: "docker-compose-fail",
		summary: "Diagnosing subtle YAML formatting errors in multi-service setups.",
		publishedAt: "2025-06-01",
		updatedAt: "2025-06-15",
	},
	{
		id: "2",
		title: "Docker Compose Won’t Build: Troubleshooting Guide",
		slug: "docker-compose-fail",
		summary: "Diagnosing subtle YAML formatting errors in multi-service setups.",
		publishedAt: "2025-06-01",
		updatedAt: "2025-06-15",
	},
	{
		id: "2",
		title: "Docker Compose Won’t Build: Troubleshooting Guide",
		slug: "docker-compose-fail",
		summary: "Diagnosing subtle YAML formatting errors in multi-service setups.",
		publishedAt: "2025-06-01",
		updatedAt: "2025-06-15",
	},
	// Add more entries here...
];

export default function BlogsPage() {
	return (
		<div className="max-w-7xl mx-auto px-6 py-16 text-gray-800">
			{/* Page Header */}
			<div className="mb-20">
				<h1 className="text-5xl font-bold text-center mb-8">View My Blogs</h1>
				<div className="flex justify-center">
					<input
						type="text"
						placeholder="Search bugs, topics, titles..."
						className="w-full md:w-1/2 px-4 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring focus:border-primary"
					/>
				</div>
			</div>

			{/* Main Grid */}
			{/* Blog List (2/3 width) */}
			<div className="max-w-4xl flex flex-col justify-center mx-auto">
				{blogs.map((post, index) => (
					<div
						key={index}
						className="border-b border-gray-300 p-6 py-8 hover:shadow-md transition"
					>
						<h2 className="text-xl font-semibold mb-2">
							<Link href={`/blogs/${post.slug}`} className="hover:text-primary">
								{post.title}
							</Link>
						</h2>
						<div className="text-xs text-gray-500 mb-4">
							Published: {new Date(post.publishedAt).toLocaleDateString()} | Updated:{" "}
							{new Date(post.updatedAt).toLocaleDateString()}
						</div>
						<p className="text-sm text-gray-600">{post.summary}</p>
					</div>
				))}
			</div>
		</div>
	);
}
