import { AddSiteForm } from "@/components/AddSiteForm";

export default function AdminAddSitePage() {
    return (
        <div className="flex-1 overflow-y-auto p-10 bg-background">
            <AddSiteForm isAdmin={true} />
        </div>
    );
}
