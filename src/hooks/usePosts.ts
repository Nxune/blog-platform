"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/types/post";

interface UsePostsOptions {
  page?: number;
  pageSize?: number;
  published?: boolean;
  tag?: string;
  search?: string;
}

export function usePosts(options: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.pageSize) params.set("pageSize", String(options.pageSize));
      if (options.published !== undefined) params.set("published", String(options.published));
      if (options.tag) params.set("tag", options.tag);
      if (options.search) params.set("search", options.search);

      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error("获取文章失败");

      const data = await res.json();
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoading(false);
    }
  }, [options.page, options.pageSize, options.published, options.tag, options.search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, total, totalPages, isLoading, error, refetch: fetchPosts };
}
