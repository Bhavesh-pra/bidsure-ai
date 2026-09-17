import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const AuditPage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Immutable Audit Trail"
      description="Cryptographically verifiable, append-only log of evaluation events."
      evidenceChainStep="AuditEvent"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
