import React from "react";

const WorkExperiences = [
	{
		title: "Software Engineer",
		company: "ActiveBooker",
		period: "Jan 2022 – Present",
		details: [
			"Built scalable UI components using React and Tailwind.",
			"Improved performance by 30% through lazy loading and code splitting.",
			"Collaborated with UX teams to optimize usability."
		]
	},
	{
		title: "Software Development Engineer",
		company: "Dolphin Dive Technology Pvt. Ltd.",
		period: "Sept 2019 - Aug 2022",
		details: [
			"Built scalable UI components using React and Tailwind.",
			"Improved performance by 30% through lazy loading and code splitting.",
			"Collaborated with UX teams to optimize usability.",
			"Built scalable UI components using React and Tailwind.",
			"Improved performance by 30% through lazy loading and code splitting.",
			"Collaborated with UX teams to optimize usability."
		]
	},
]


const Educations = [
	{
		title: "MASc in Software Engineering",
		institute: "Memorial University of Newfoundland",
		period: "Sept 2022 – April 2024",
		details: [
			"Built scalable UI components using React and Tailwind.",
			"Improved performance by 30% through lazy loading and code splitting.",
			"Collaborated with UX teams to optimize usability."
		]
	},
	{
		title: "Bachelors in Electronics and Communication Engineering",
		institute: "Thapathali Campus, TU",
		period: "Nov 2015 - August 2019",
		details: [
			"Built scalable UI components using React and Tailwind.",
			"Improved performance by 30% through lazy loading and code splitting.",
			"Collaborated with UX teams to optimize usability."
		]
	},
]

export default function ResumeDetail() {
	return (
		<div className="px-6 py-12 space-y-16 font-sans text-gray-800">
			{/* Work Experience */}
			<section>
				<h2 className="text-3xl font-bold tracking-tight mb-8">Work Experience</h2>
				<div className="">
					{WorkExperiences.map((job, i) => (
						<div
							key={i}
							className="p-6 bg-white border-b border-b-gray-300"
						>
							<div className="flex justify-between items-center mb-1">
								<h3 className="text-xl font-semibold">{job.title}</h3>
								<span className="text-sm text-gray-500">{job.period}</span>
							</div>
							<p className="text-sm text-gray-500 italic mb-2">{job.company}</p>
							<ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
								{job.details.map((d, idx) => (
									<li key={idx}>{d}</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</section>

			{/* Education */}
			<section>
				<h2 className="text-3xl font-bold tracking-tight mb-8">Education</h2>
				<div className="">
					{Educations.map((job, i) => (
						<div
							key={i}
							className="p-6 bg-white border-b border-b-gray-300"
						>
							<div className="flex justify-between items-center mb-1">
								<h3 className="text-xl font-semibold">{job.title}</h3>
								<span className="text-sm text-gray-500">{job.period}</span>
							</div>
							<p className="text-sm text-gray-500 italic mb-2">{job.institute}</p>
							<ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
								{job.details.map((d, idx) => (
									<li key={idx}>{d}</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</section>

			{/* Skills */}
			<section>
				<h2 className="text-3xl font-bold tracking-tight mb-8">Skills</h2>
				<div className="flex flex-wrap gap-3">
					{[
						"React",
						"Next.js",
						"TypeScript",
						"Tailwind CSS",
						"Node.js",
						"Git",
						"REST APIs",
						"Figma",
						"Vite",
						"Framer Motion"
					].map((skill, idx) => (
						<span
							key={idx}
							className="bg-gray-100 border border-gray-200 text-sm text-gray-800 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
						>
							{skill}
						</span>
					))}
				</div>
			</section>
		</div>
	);
}
