import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";

export default function AccountsLoading() {
  return (
    <TablePageSkeleton
      titleWidth="w-40"
      showKpiRow
      columns={7}
      rows={10}
    />
  );
}
