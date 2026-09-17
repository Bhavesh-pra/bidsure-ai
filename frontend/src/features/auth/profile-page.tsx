import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const ProfilePage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Bidder Profile"
      description="Organization details, GSTIN, PAN, and Udyam registration."
      evidenceChainStep="OrganizationProfile"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
