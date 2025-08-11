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
		id: "3",
		title: "Concepts of Apache Kafka",
		slug: "apache-kafka-concepts",
		summary: "Apache Kafka has recently become very popular for data streaming. Many people also use it as a queuing and messaging platform, including for asynchronous communication. For example, imagine an IoT (Internet of Things) system with many construction vehicles operating in a construction zone for a company. We want to track each vehicle&apos;s movement, GPS location, activities, tire pressure, and other safety-related data. The goal is to log this information, visualize it later, and send notifications if any risks are detected. This creates a large amount of data, as each vehicle may send multiple types of data every few seconds (for example, every 10 seconds). Apache Kafka Streams can handle this kind of data flow efficiently.",
		publishedAt: "2025-08-11",
		updatedAt: "2025-08-11"
	},
	{
		id: "2",
		title: "News Feed System Design",
		slug: "news-feed-system-design",
		summary: "I'm passionate about system design, and while reading System Design Interview - An Insider's Guide by Alex, I decided to write my own take on the concepts. This helps me deepen my understanding and retain the ideas more effectively.",
		publishedAt: "2025-07-20",
		updatedAt: "2025-07-20",
	},
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
