import { ArrowDownCircleIcon, CloudArrowDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { PButton } from "@/app/ui";

const SkillSet: Array<Array<string>> = [
	["C#", ".NET"],
	["JavaScript", "TypeScript", "Angular", "React", "Next.js"],
	["PostgreSQL", "MsSQL", "MySQL"],
	["Python", "Pandas", "NumPy"],
	["AWS", "Azure", "Docker", "CI/CD"],
];


export default function Resume() {
	return (
		<div className="h-full flex flex-1 gap-10 flex-col w-full items-center">
			<div className="w-full flex-1 flex gap-10 flex-col md:flex-row py-12">
				<div className="flex flex-col gap-12 justify-center ">
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

				<div className="flex-1 flex flex-col items-center justify-center gap-6 text-sm md:text-base text-gray-700">
					<h3 className="text-3xl font-semibold flex items-center gap-2 capitalize">
						Get My Full Resume
					</h3>

					<p className="max-w-sm text-center leading-relaxed text-sm md:text-base text-gray-600">
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
						<CloudArrowDownIcon className="w-6 h-6" aria-hidden="true" />
						Download Now
					</a>
				</div>
			</div>

			<div className="flex justify-center md:justify-start py-12">
				<PButton variant="outlined" severity="secondary">
					<ArrowDownCircleIcon className="w-6 h-6 mr-4" aria-hidden="true" />
					View My Resume in Detail
				</PButton>
			</div>
		</div>
	);
}
