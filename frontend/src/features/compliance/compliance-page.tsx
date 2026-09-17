import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const CompliancePage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Compliance Evaluation"
      description="Deterministic rule verification and exception detection."
      evidenceChainStep="ComplianceRule"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
