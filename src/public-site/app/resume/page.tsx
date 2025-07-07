import Link from "next/link";

export default function Resume() {
	return (
		<div className="h-full flex flex-col items-center justify-center flex-1 gap-10">
			<h1 className="text-6xl font-extrabold text-gray-900">🚀 Coming Soon</h1>
			<p className="text-lg text-gray-600 max-w-md text-center mb-8">
				I am working hard to launch something awesome. Stay tuned!
			</p>
			<Link
				href="/"
				className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-md transition"
			>
				Take me Home
			</Link>
		</div>
	);
}