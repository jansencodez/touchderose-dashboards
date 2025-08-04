import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "booking" | "payment" | "feedback";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "booking",
}) => {
  const getStatusColor = (status: string, type: string) => {
    if (type === "booking") {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "confirmed":
          return "bg-blue-100 text-blue-800";
        case "in_progress":
          return "bg-orange-100 text-orange-800";
        case "completed":
          return "bg-green-100 text-green-800";
        case "cancelled":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    } else if (type === "payment") {
      switch (status) {
        case "pending":
          return "bg-yellow-100 text-yellow-800";
        case "completed":
          return "bg-green-100 text-green-800";
        case "failed":
          return "bg-red-100 text-red-800";
        case "refunded":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    } else if (type === "feedback") {
      switch (status) {
        case "new":
          return "bg-blue-100 text-blue-800";
        case "in_review":
          return "bg-yellow-100 text-yellow-800";
        case "resolved":
          return "bg-green-100 text-green-800";
        case "closed":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }
    return "bg-gray-100 text-gray-800";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        status,
        type
      )}`}
    >
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
};
