"use client";

import { useState, useEffect } from "react";
import { PostCard } from "@/components/blog/PostCard";
import type { Post } from "@/types/post";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
        }
      } catch {
        // ignore
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
      />

      {isLoading && (
        <p className="text-center text-muted-foreground">搜索中...</p>
      )}

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
