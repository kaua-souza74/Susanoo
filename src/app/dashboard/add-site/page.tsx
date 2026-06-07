import { AddSiteForm } from "@/components/AddSiteForm";

export default function AddSitePage() {
    return (
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
            <AddSiteForm isAdmin={false} />
        </div>
    );
}
