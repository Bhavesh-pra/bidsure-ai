import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const SettingsPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="System Settings"
      description="Organization preferences and role-based policies."
      evidenceChainStep="Settings"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
