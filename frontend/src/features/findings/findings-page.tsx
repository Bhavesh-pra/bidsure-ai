import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const FindingsPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Findings & Discrepancies"
      description="Identified compliance flags and statutory discrepancies."
      evidenceChainStep="Finding"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
