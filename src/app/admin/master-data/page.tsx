import { MasterDataForm } from "@/components/admin/master-data-form";
import { getProgramCatalog, getTemplateData } from "@/lib/app-data";

export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
  const [programList, template] = await Promise.all([getProgramCatalog(), getTemplateData()]);

  return <MasterDataForm programList={programList} template={template} />;
}
