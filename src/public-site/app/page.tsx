import Link from "next/link";

const latestBlogs = [
	{
		title: "Concept of Apache Kafka",
		slug: 'apache-kafka-concepts'
	},
	{
		title: "News Feed System Design",
		slug: "news-feed-system-design"
	},
	{
		title: "How to write clean code?",
		slug: "clean-code"
	}
]

export default function Home() {
	return (
		<div className="h-full flex flex-1 gap-56 flex-col md:flex-row py-12">
			<div className="flex-1 flex flex-col items-center justify-center gap-14">
				<h1 className="text-4xl md:text-6xl font-extrabold text-center capitalize tracking-wider leading-snug">
					Hey, I&rsquo;m <br /> Prabin Kumar Shrestha
				</h1>
				<p className="text-lg md:text-xl text-gray-600 max-w-3xl text-center tracking-wide">
					I am a dedicated Software Engineer with a profound passion for the latest technology. My commitment to continuous learning drives my enthusiasm for overcoming challenges, and I strongly believe in sharing knowledge for community growth.
				</p>
				<Link href="https://github.com/prabinkshrestha" target="blank" className="mt-10">
					<span className="py-3 px-10 bg-primary text-white rounded-md hover:bg-primary-700 flex items-center justify-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 30 30" fill="currentColor" className="text-white">
							<path d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"></path>
						</svg>
						Visit my GitHub
					</span>
				</Link>
			</div>

			<div className="flex flex-col justify-center gap-6 text-sm md:text-base text-gray-700">
				<div className="space-y-1">
					<p className="text-gray-500 uppercase text-xs tracking-wide">Currently</p>
					<p>
						<strong>Lead Software Engineer</strong> at
						<span className="text-primary">
							<Link href="https://activebooker.com" target="_blank"> ActiveBooker</Link>
						</span>
					</p>
				</div>

				<div className="space-y-1">
					<p className="text-gray-500 uppercase text-xs tracking-wide">Education</p>
					<p>MASc in Software Engineering, MUN</p>
				</div>

				<div className="space-y-1">
					<p className="text-gray-500 uppercase text-xs tracking-wide">Address</p>
					<p>St. John&rsquo;s, NL, Canada</p>
				</div>

				<div className="space-y-2 mt-4">
					<p className="text-gray-500 uppercase text-xs tracking-wide">Latest from my blog</p>
					<ul className="space-y-1 list-none">
						{latestBlogs.map((blog) => (
							<li key={blog.slug}>
								<Link href={`/blogs/${blog.slug}`} className=" hover:underline">
									{blog.title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
