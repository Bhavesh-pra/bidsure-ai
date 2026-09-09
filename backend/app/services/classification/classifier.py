"""
Document Classifier Service for BidSure AI — Cycle 9.

Implements deterministic, multi-tiered keyword and pattern classification
to categorize procurement documents with calibrated confidence scoring,
robust unknown handling, and review-routing for ambiguous cases.
"""

import math
import re
from typing import Dict, List, Optional, Tuple
from app.services.classification.document_types import (
    ClassificationMethod,
    ClassificationStatus,
    DocumentType,
)
from app.services.classification.rules import (
    DOCUMENT_RULES,
    REGEX_PATTERNS,
    WEIGHT_EXACT_PHRASE,
    WEIGHT_FIRST_PAGE_BONUS,
    WEIGHT_REGEX_PATTERN,
    WEIGHT_STRONG_KEYWORD,
    WEIGHT_SUPPORTING_KEYWORD,
    apply_context_disambiguation,
)
from app.services.classification.schemas import (
    ClassificationResult,
    ClassifierConfig,
    MatchedSignal,
    SignalType,
)


class DocumentClassifier:
    """
    Deterministic document classifier.
    Operates on OCR raw text and page-aware text streams.
    """

    def __init__(self, config: Optional[ClassifierConfig] = None):
        self.config = config or ClassifierConfig()

    def normalize_text(self, text: str) -> str:
        """
        Normalizes OCR text for consistent pattern matching.
        Collapses whitespace, normalizes quotes, and handles common OCR variations.
        """
        if not text:
            return ""
        # Unicode quotes and dashes normalization
        cleaned = (
            text.replace("“", '"')
            .replace("”", '"')
            .replace("‘", "'")
            .replace("’", "'")
            .replace("—", "-")
            .replace("–", "-")
        )
        # Collapse multiple whitespaces and lowercase
        cleaned = re.sub(r"[ \t]+", " ", cleaned)
        cleaned = re.sub(r"\r\n|\r", "\n", cleaned)
        return cleaned.strip().lower()

    def _extract_page_signals(
        self, norm_page: str, page_num: int
    ) -> Tuple[Dict[DocumentType, float], Dict[DocumentType, List[str]]]:
        """Extracts signals from a single normalized page and calculates raw scores."""
        scores: Dict[DocumentType, float] = {t: 0.0 for t in DocumentType if t != DocumentType.UNKNOWN}
        signals: Dict[DocumentType, List[str]] = {t: [] for t in DocumentType if t != DocumentType.UNKNOWN}

        multiplier = self.config.page_1_weight_multiplier if page_num == 1 else 1.0

        for doc_type, rules in DOCUMENT_RULES.items():
            # 1. Exact phrases
            for phrase in rules.get("exact_phrases", []):
                if phrase in norm_page:
                    scores[doc_type] += WEIGHT_EXACT_PHRASE * multiplier
                    signals[doc_type].append(f"PHRASE: {phrase}")

            # 2. Strong keywords (word boundary matching for short tokens)
            for kw in rules.get("strong_keywords", []):
                pattern = r"\b" + re.escape(kw) + r"\b"
                if re.search(pattern, norm_page):
                    scores[doc_type] += WEIGHT_STRONG_KEYWORD * multiplier
                    signals[doc_type].append(f"STRONG: {kw}")

            # 3. Supporting keywords
            for kw in rules.get("supporting_keywords", []):
                pattern = r"\b" + re.escape(kw) + r"\b"
                if re.search(pattern, norm_page):
                    scores[doc_type] += WEIGHT_SUPPORTING_KEYWORD * multiplier
                    signals[doc_type].append(f"SUPPORT: {kw}")

            # 4. Regex patterns
            patterns = REGEX_PATTERNS.get(doc_type, [])
            for pat in patterns:
                matches = pat.findall(norm_page)
                if matches:
                    scores[doc_type] += WEIGHT_REGEX_PATTERN * multiplier
                    sample_match = matches[0] if isinstance(matches[0], str) else matches[0][0]
                    signals[doc_type].append(f"REGEX: {sample_match}")

        return scores, signals

    def _score_to_confidence(self, raw_score: float) -> float:
        """
        Maps a non-negative raw score into a calibrated [0.0, 1.0] confidence score
        using an exponential saturation curve.
        """
        if raw_score <= 0.0:
            return 0.0
        # Calibration curve: raw_score 1.25 -> ~0.65; raw_score 2.5 -> ~0.88; raw_score >= 4.0 -> ~0.96+
        conf = 1.0 - math.exp(-raw_score / 1.2)
        # Bound between 0.0 and 0.99 for rule-based confidence
        return min(0.99, max(0.0, conf))

    def classify(
        self,
        text: str,
        document_id: Optional[str] = None,
        pages: Optional[List[str]] = None,
    ) -> ClassificationResult:
        """
        Classifies the document from its extracted text.

        Args:
            text: Concatenated raw text of the document.
            document_id: Optional identifier for tracking/audit.
            pages: Optional list of raw text strings per page.

        Returns:
            ClassificationResult containing DocumentType, confidence, and status.
        """
        # Guard: Check for empty or negligible text
        if not text or not text.strip():
            return ClassificationResult(
                document_id=document_id,
                document_type=DocumentType.UNKNOWN,
                confidence=0.0,
                status=ClassificationStatus.REVIEW_REQUIRED,
                method=ClassificationMethod.RULE_BASED,
                matched_signals=[],
                scores_by_type={},
                review_reason="EMPTY_OR_NO_TEXT",
            )

        words = text.split()
        if len(words) < self.config.min_words:
            return ClassificationResult(
                document_id=document_id,
                document_type=DocumentType.UNKNOWN,
                confidence=0.0,
                status=ClassificationStatus.REVIEW_REQUIRED,
                method=ClassificationMethod.RULE_BASED,
                matched_signals=[],
                scores_by_type={},
                review_reason="INSUFFICIENT_TEXT",
            )

        # Prepare page segments
        page_texts: List[str] = []
        if pages and len(pages) > 0:
            page_texts = pages
        elif "\n\n--- PAGE BREAK ---\n\n" in text:
            page_texts = text.split("\n\n--- PAGE BREAK ---\n\n")
        else:
            page_texts = [text]

        # Aggregate raw scores across pages
        combined_raw_scores: Dict[DocumentType, float] = {
            t: 0.0 for t in DocumentType if t != DocumentType.UNKNOWN
        }
        combined_signals: Dict[DocumentType, List[str]] = {
            t: [] for t in DocumentType if t != DocumentType.UNKNOWN
        }

        for idx, page_raw in enumerate(page_texts):
            norm_p = self.normalize_text(page_raw)
            p_scores, p_signals = self._extract_page_signals(norm_p, page_num=idx + 1)
            for t in combined_raw_scores:
                combined_raw_scores[t] += p_scores[t]
                # Keep unique matched signals
                for sig in p_signals[t]:
                    if sig not in combined_signals[t]:
                        combined_signals[t].append(sig)

        # Apply context disambiguation (cross-category suppression)
        adjusted_scores = apply_context_disambiguation(combined_raw_scores, combined_signals)

        # Convert raw scores to confidence scores
        confidence_by_type: Dict[str, float] = {
            t.value: round(self._score_to_confidence(score), 4)
            for t, score in adjusted_scores.items()
        }

        # Sort candidate types by confidence descending
        ranked_candidates = sorted(
            [(t, confidence_by_type[t.value]) for t in adjusted_scores.keys()],
            key=lambda item: item[1],
            reverse=True,
        )

        top_type, top_conf = ranked_candidates[0]
        second_type, second_conf = ranked_candidates[1] if len(ranked_candidates) > 1 else (DocumentType.UNKNOWN, 0.0)

        # Decision Logic:
        # Case 1: No signals matched at all
        if top_conf == 0.0:
            return ClassificationResult(
                document_id=document_id,
                document_type=DocumentType.UNKNOWN,
                confidence=0.0,
                status=ClassificationStatus.REVIEW_REQUIRED,
                method=ClassificationMethod.RULE_BASED,
                matched_signals=[],
                scores_by_type=confidence_by_type,
                review_reason="NO_MATCHING_SIGNALS",
            )

        # Case 2: Confidence below threshold
        if top_conf < self.config.confidence_threshold:
            return ClassificationResult(
                document_id=document_id,
                document_type=DocumentType.UNKNOWN,
                confidence=top_conf,
                status=ClassificationStatus.REVIEW_REQUIRED,
                method=ClassificationMethod.RULE_BASED,
                matched_signals=combined_signals.get(top_type, []),
                scores_by_type=confidence_by_type,
                review_reason="LOW_CONFIDENCE",
            )

        # Case 3: Ambiguous document (top 2 candidates are very close and both significant)
        margin = top_conf - second_conf
        if margin < self.config.margin_threshold and second_conf >= (self.config.confidence_threshold - 0.15):
            ambiguous_signals = (
                combined_signals.get(top_type, [])[:3] + combined_signals.get(second_type, [])[:3]
            )
            return ClassificationResult(
                document_id=document_id,
                document_type=DocumentType.UNKNOWN,
                confidence=top_conf,
                status=ClassificationStatus.REVIEW_REQUIRED,
                method=ClassificationMethod.RULE_BASED,
                matched_signals=ambiguous_signals,
                scores_by_type=confidence_by_type,
                review_reason="AMBIGUOUS_DOCUMENT",
            )

        # Case 4: High confidence clear classification
        return ClassificationResult(
            document_id=document_id,
            document_type=top_type,
            confidence=top_conf,
            status=ClassificationStatus.CLASSIFIED,
            method=ClassificationMethod.RULE_BASED,
            matched_signals=combined_signals.get(top_type, []),
            scores_by_type=confidence_by_type,
            review_reason=None,
        )
