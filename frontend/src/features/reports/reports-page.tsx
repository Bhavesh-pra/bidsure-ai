import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const ReportsPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Tender Evaluation Reports"
      description="Comprehensive audit-ready evaluation summaries."
      evidenceChainStep="AuditReport"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
