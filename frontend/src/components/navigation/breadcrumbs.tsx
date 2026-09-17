import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_NAME_MAP: Record<string, string> = {
  officer: "Officer Console",
  bidder: "Bidder Portal",
  dashboard: "Dashboard",
  tenders: "Tenders",
  bids: "Bids & Submissions",
  requirements: "Requirements",
  compliance: "Compliance",
  evidence: "Evidence",
  findings: "Findings & Risk",
  decision: "Decision",
  audit: "Audit Trail",
  verification: "Verification",
  reports: "Reports",
  settings: "Settings",
  clarifications: "Clarifications",
  profile: "Bidder Profile",
  documents: "Documents Vault",
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const location = useLocation();

  const breadcrumbs = React.useMemo(() => {
    if (items && items.length > 0) return items;

    const pathSegments = location.pathname.split("/").filter(Boolean);
    const generated: BreadcrumbItem[] = [];

    let currentPath = "";
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]!;
      currentPath += `/${segment}`;

      // Check if segment is a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      const label = isUuid
        ? "Details"
        : ROUTE_NAME_MAP[segment.toLowerCase()] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Don't link the last item
      const isLast = i === pathSegments.length - 1;
      generated.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    }

    return generated;
  }, [items, location.pathname]);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-xs text-slate-500 mb-4", className)}>
      <ol className="flex items-center space-x-1.5 list-none m-0 p-0 flex-wrap">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center text-slate-400 hover:text-slate-700 transition-colors"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <li key={idx} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" aria-hidden="true" />
              {crumb.href && !isLast ? (
                <Link
                  to={crumb.href}
                  className="font-medium text-slate-600 hover:text-blue-600 transition-colors max-w-xs truncate"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="font-semibold text-slate-900 max-w-xs truncate"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
