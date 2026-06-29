import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ModulePlaceholder({ title, description }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <p className="text-sm font-medium text-accdoo-blue">HRM Foundation</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-950">{title}</h1>
      </div>
      <section className="rounded-md border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex max-w-2xl flex-col gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accdoo-blueSoft text-accdoo-blue">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-950">Module foundation is ready</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {description || "This HRMS module route is available and ready for the next implementation phase."}
            </p>
          </div>
          <Link href="/hrm/employees" className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Link>
        </div>
      </section>
    </div>
  );
}
