import Link from "next/link";

export default function NotFoundPage() {
	return (
		<div className="h-full flex flex-col items-center justify-center text-center px-4 gap-8">
			<div className="flex gap-4 font-medium text-2xl ">
				<h1 className="">404</h1>
				|
				<p className="">Page not found</p>
			</div>
			<p className="text-gray-600 mb-6">Sorry, we couldn't find the page you're looking for.</p>
			<Link
				href="/"
				className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-md transition"
			>
				Take me Home
			</Link>
		</div>
	);
}