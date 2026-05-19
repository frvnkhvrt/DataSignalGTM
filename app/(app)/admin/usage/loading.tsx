import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";

export default function UsageLoading() {
  return (
    <TablePageSkeleton
      titleWidth="w-48"
      descriptionWidth="w-96"
      columns={5}
      rows={12}
    />
  );
}
