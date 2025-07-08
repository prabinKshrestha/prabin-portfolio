import { ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const SkillSet: Array<Array<string>> = [
	["C#", ".NET"],
	["JavaScript", "TypeScript", "Angular", "React", "Next.js"],
	["PostgreSQL", "MsSQL", "MySQL"],
	["Python", "Pandas", "NumPy"],
	["AWS", "Azure", "Docker", "CI/CD"],
];


export default function Resume() {
	return (
		<div className="flex flex-col md:flex-row gap-48 w-full h-full items-center px-18 py-12 max-w-7xl mx-auto">
			{/* Left: Highlights */}
			<div className="flex flex-col gap-12 flex-1 text-gray-700 text-center md:text-left">
				{/* Current Role */}
				<div className="space-y-1">
					<p className="text-xs uppercase tracking-wide text-gray-500">Currently</p>
					<p className="text-xl font-semibold">
						Lead Software Engineer at
						<Link
							href="https://activebooker.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							&nbsp;ActiveBooker
						</Link>
					</p>
					<p className="max-w-md mx-auto md:mx-0 text-md">
						Full Stack Software Engineer focusing on scalable SaaS platform.
					</p>
				</div>

				{/* Education */}
				<div className="space-y-1">
					<p className="text-xs uppercase tracking-wide text-gray-500">Education</p>
					<p className="text-xl font-semibold">MASc in Software Engineering</p>
					<p className="max-w-md mx-auto md:mx-0 text-md">Memorial University of Newfoundland (MUN)</p>
				</div>

				{/* Skills */}
				<div className="space-y-2">
					<p className="text-xs uppercase tracking-wide text-gray-500">Skills</p>
					<div className="max-w-md mx-auto md:mx-0 text-md  space-y-2">
						{
							SkillSet.map((set, index) =>
								<div key={index} className="flex gap-2">
									{
										set.map(s =>
											<span
												key={s}
												className="py-1 px-3 border border-primary rounded text-xs"
											>
												{s}
											</span>
										)
									}
								</div>
							)
						}
					</div>
				</div>
			</div>

			{/* Right: Resume Download */}
			<aside className="flex flex-col items-center md:items-start gap-6 max-w-xs mx-auto md:mx-0 text-gray-800">
				<h3 className="text-2xl font-semibold flex items-center gap-2">
					Get my full resume
				</h3>

				<p className="max-w-xs text-sm leading-relaxed text-center md:text-left text-gray-500">
					Download the complete version of my resume, including detailed experience, projects, and skills.
				</p>

				<a
					href="/Prabin_Kumar_Shrestha_Resume.pdf"
					target="_blank"
					rel="noopener noreferrer"
					download
					className="inline-flex items-center justify-center w-full md:w-auto gap-3 px-10 py-3 font-semibold text-white bg-primary rounded-md shadow-md hover:bg-primary-700 transition mt-4"
					aria-label="Download Resume PDF"
				>
					<ArrowDownOnSquareIcon className="w-6 h-6" aria-hidden="true" />
					Download Now
				</a>
			</aside>
		</div>
	);
}
