import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Page not found.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
