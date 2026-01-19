import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import Badge from "../../components/ui/badge/Badge";
import Button from "../ui/button/Button";
import ProgressBar from "../common/ProgressBar";

interface Order {
  id: number;
  user: {
    image: string;
    name: string;
  };
  projectName: string;
  status: "launched" | "pending" | "active" | "canceled";  
  progress: number;
}

// Define the table data using the interface
const tableData: Order[] = [
  {
    id: 1,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Lindsey Curtis",
    },
    projectName: "Agency Website",
    progress: 39,
    status: "active",
  },
  {
    id: 2,
    user: {
      image: "/images/user/user-18.jpg",
      name: "Kaiya George",
    },
    projectName: "Technology",
    progress: 24.9,
    status: "pending",
  },
  {
    id: 3,
    user: {
      image: "/images/user/user-17.jpg",
      name: "Zain Geidt",
    },
    projectName: "Blog Writing",
    progress: 100,
    status: "active",
  },
  {
    id: 4,
    user: {
      image: "/images/user/user-20.jpg",
      name: "Abram Schleifer",
    },
    projectName: "Social Media",
    progress: 34.5,
    status: "canceled",
  },
  {
    id: 5,
    user: {
      image: "/images/user/user-21.jpg",
      name: "Carla George",
    },
    projectName: "Website",
    progress: 100,
    status: "active",
  },
];

export default function AssesmentTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Title
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Assesment
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Progress
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {tableData.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={order.user.image}
                        alt={order.user.name}
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.user.name}
                      </span>   
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.projectName}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      order.status === "active"
                        ? "success"
                        : order.status === "pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <ProgressBar type="default" progress={order.progress} />
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  <Button disabled={order.status !== "active"} className="rounded-xl">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
