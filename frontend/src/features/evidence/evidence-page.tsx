import React from "react";
import { FeaturePlaceholder } from "@/components/ui/feature-placeholder";

export const EvidencePage: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Extracted Evidence"
      description="Facts extracted via OCR with confidence provenance."
      evidenceChainStep="ExtractedEvidence"
      statusExample="REVIEW_REQUIRED"
    />
  );
};
