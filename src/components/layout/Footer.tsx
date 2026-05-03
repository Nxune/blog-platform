export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI Coding 开发者社区
        </p>
        <nav className="flex items-center gap-4">
          <a href="/about" className="text-sm text-muted-foreground hover:text-foreground">
            关于
          </a>
        </nav>
      </div>
    </footer>
  );
}
