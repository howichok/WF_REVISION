export default function Loading() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-2xl border border-[#ddd5ca] bg-[#f7f3ed]" />
      ))}
    </div>
  );
}
