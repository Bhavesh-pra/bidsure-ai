import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const DecisionPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Officer Final Decision"
      description="Human-in-the-loop authority decision and override sign-off."
      evidenceChainStep="OfficerDecision"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
