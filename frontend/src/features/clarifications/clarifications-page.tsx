import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const ClarificationsPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Tender Clarifications"
      description="Submit queries and review pre-bid meeting addenda."
      evidenceChainStep="ClarificationRequest"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
