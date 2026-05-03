"use client";

import { useState, useEffect } from "react";
import { PostCard } from "@/components/blog/PostCard";
import type { Post } from "@/types/post";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setHasSearched(false);
      setError("");
      return;
    }

    setError("");
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
        } else {
          setError("搜索请求失败，请稍后重试");
          setPosts([]);
        }
      } catch {
        setError("网络错误，请检查连接后重试");
        setPosts([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">搜索</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索文章..."
        className="mb-8 w-full rounded-lg border px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-primary"
        autoFocus
        aria-label="搜索文章"
      />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">搜索中...</p>
        </div>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      {!isLoading && hasSearched && posts.length === 0 && (
        <p className="text-center text-muted-foreground">
          未找到与 &ldquo;{query}&rdquo; 相关的文章
        </p>
      )}

      {!isLoading && posts.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            找到 {posts.length} 篇文章
          </p>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
