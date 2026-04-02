/**
 * Skeleton loading placeholder for menu items.
 * Renders animated shimmer cards while menu data loads.
 */
export default function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image shimmer"></div>
            <div className="skeleton-content">
                <div className="skeleton-line skeleton-title shimmer"></div>
                <div className="skeleton-line skeleton-desc shimmer"></div>
                <div className="skeleton-line skeleton-desc-short shimmer"></div>
                <div className="skeleton-footer">
                    <div className="skeleton-line skeleton-price shimmer"></div>
                    <div className="skeleton-line skeleton-btn shimmer"></div>
                </div>
            </div>
        </div>
    );
}
