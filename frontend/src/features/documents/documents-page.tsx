import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const DocumentsPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Document Vault"
      description="Pre-uploaded statutory certificates and financial reports."
      evidenceChainStep="BidDocument"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
