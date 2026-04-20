export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Spoilering.</p>
        <p>Resúmenes con spoilers, finales explicados y cero rodeos.</p>
      </div>
    </footer>
  );
}
