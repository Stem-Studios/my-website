import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>A fresh direction.</h1>
      <p>This page isn’t part of your workspace.</p>
      <Link className="button button-primary" href="/dashboard">
        Back to your overview
      </Link>
    </main>
  );
}
