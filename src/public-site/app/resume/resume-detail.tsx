import React from "react";

const WorkExperiences = [
	{
		title: "Software Engineer",
		company: "ActiveBooker",
		period: "July 2023 – Present",
		details: [
			"Merged two separate databases into a single consolidated database using Python scripts, ensuring data integrity and minimal downtime in a production environment. ",
			"Migrated applications and databases from AWS to Azure, and designed and deployed a membership subsystem for the booking system in Azure using Azure Storage, Azure Web Apps, Static Web Apps, PostgreSQL, .NET, Angular, and Azure Functions for job execution, backed up by CI/CD pipeline integration in Azure Devops. ",
			"Implemented custom subscription management and payment processing to streamline billing cycles and user subscriptions.",
			"Optimized complex SQL queries, reducing execution times from 30–45 seconds to under 1 second, significantly improving performance and reducing database load.",
			"Developed and deployed a custom Zapier application to automate workflows and integrate third-party services for clients.",
			"Followed industry best practices for cloud deployment to ensure security, scalability, and maintainability.",
		]
	},
	{
		title: "Graduate Assistantship",
		company: "Memorial University of Newfoundland",
		period: "Sept 2023 - Dec 2023",
		details: [
			"Assisted students in the lab with questions regarding Data Structures and Algorithm course work",
		]
	},
	{
		title: "Software Development Engineer",
		company: "Dolphin Dive Technology Pvt. Ltd.",
		period: "Sept 2019 - Aug 2022",
		details: [
			"With a team, redeveloped windows desktop application in web using Angular and .NET",
			"Database management including design, create, modify, and optimize using SQL Server",
			"Resolved more than 200 production bugs along with research and development of new features",
			"Peer-reviewed with developers for checking redundancy, minimizing errors and maintaining company code pattern",
			"Helped new developers about the underlying business specific knowledge, project structure, development and debugging, utilizing the role of experienced developer",
		]
	},
	{
		title: "Web Developer",
		company: "Nectar Digit Pvt. Ltd.",
		period: "Aug 2018 - Jul 2019",
		details: [
			"Designed, planned and developed the web application according to the business requirements with a constant communication with client",
			"Tutored basic and real-world programming to interns",
			"Completed a web application CCSNepal, a Job Portal, with the help of PHP, Code Igniter, Javascript, jQuery, HTML, and CSS.",
		]
	},
]


const Educations = [
	{
		title: "MASc in Software Engineering",
		institute: "Memorial University of Newfoundland",
		period: "Sept 2022 – April 2024",
		details: [
			"Courses: Software Fundamentals | Software Design and Specification | Software Verification and Validation | Software Engineering | Advanced Computing Concept in Engineering | Applied Algorithms | Database Technology and Application | Introduction to Data Visualization | Computer Vision",
			"Fellow of the School of Graduate Studies (Academic Year 2023-2024)",
			"First Class In-Program Scholarship (MASc. Software Engineering)"
		]
	},
	{
		title: "Bachelors in Electronics and Communication Engineering",
		institute: "Thapathali Campus, TU",
		period: "Nov 2015 - August 2019",
		details: []
	},
]

const Skills = [
	"C#",
	".NET",
	"SQL",
	"Javascript",
	"Typescript",
	"Angular",
	"Azure",
	"AWS",
	"CI-CD",
	"Python",
	"React"
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
							<ul className="list-disc space-y-1 text-gray-700 text-sm">
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
							<ul className="list-disc space-y-1 text-gray-700 text-sm">
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
					{Skills.map((skill, idx) => (
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
