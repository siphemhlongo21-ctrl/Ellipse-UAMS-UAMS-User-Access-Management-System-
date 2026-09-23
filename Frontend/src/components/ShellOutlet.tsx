import { AppShell } from "../../layout";
import { type BreadcrumbItem } from "../../layout";
import { PlaceholderPage } from "../../components";

export function ShellOutlet({
  title,
  description,
  breadcrumbs,
}: {
  title: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return (
    <AppShell breadcrumbs={breadcrumbs}>
      <PlaceholderPage title={title} description={description} />
    </AppShell>
  );
}