import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const RequirementsPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Tender Requirements"
      description="Deterministic evaluation requirements matrix."
      evidenceChainStep="Requirement"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
