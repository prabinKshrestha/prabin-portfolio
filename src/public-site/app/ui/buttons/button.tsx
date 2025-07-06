"use client";

import React from "react";


type Variant = "text" | "outlined" | "fill";
type Severity = "primary" | "secondary";
type VariantSeverityStyle = {
	[K in Severity]: {
		[V in Variant]: string;
	};
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant;
	severity: Severity;
	children: React.ReactNode;
}

const variantStyles: VariantSeverityStyle = {
	primary: {
		text: "border border-primary text-primary hover:bg-primary hover:text-white focus:ring-1 focus:ring-primary",
		outlined: "border border-primary text-primary hover:bg-primary hover:text-white focus:ring-1 focus:ring-primary",
		fill: "bg-primary text-white hover:bg-primary-dark focus:ring-1 focus:ring-primary-dark",
	},
	secondary: {
		text: "border border-gray-600 text-gray-800 hover:bg-gray-100 hover:text-black focus:ring-1 focus:ring-gray-400",
		outlined: "border border-gray-600 text-gray-800 hover:bg-gray-100 hover:text-black focus:ring-1 focus:ring-gray-400",
		fill: "bg-gray-800 text-white hover:bg-gray-700 focus:ring-1 focus:ring-gray-600",
	},
};

export const PButton: React.FC<ButtonProps> = ({
	children,
	variant = "fill",
	severity = "primary",
	...props
}) => {
	const style = variantStyles[severity][variant];

	return (
		<button
			className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none cursor-pointer ${style} ${props.className || ""}`}
			{...props}
		>
			{children}
		</button>
	);
};
