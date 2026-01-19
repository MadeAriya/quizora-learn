import React from "react";

// interface for progress bar
interface ProgressBarProps {
    progress: number;
    type: "default" | "warning" | "error";
    className?: React.HTMLAttributes<HTMLDivElement>['className'];
}

export default function ProgressBar({ progress, type, className }: ProgressBarProps) {
    return (
        <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
            <div className={`h-2.5 rounded-full ${type === "default" ? "bg-blue-600" : type === "warning" ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${progress}%` }}></div>
        </div>
    );
}