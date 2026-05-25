interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export default function LoadingSkeleton({ lines = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer rounded h-4"
          style={{ width: i % 3 === 2 ? "60%" : "100%", height: "16px" }}
        />
      ))}
    </div>
  );
}
