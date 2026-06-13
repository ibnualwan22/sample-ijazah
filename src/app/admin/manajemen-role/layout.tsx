import { requirePermission } from "@/lib/permission";

export default async function ManajemenRoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("manajemen_role");
  return <>{children}</>;
}
