"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Post } from "@/types/post";
import { formatDate, truncate } from "@/lib/utils";

interface PostCardProps {
  post: Post & { likeCount?: number; liked?: boolean };
}

export function PostCard({ post }: PostCardProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.slug}/like`, { method: "POST" });
      if (!res.ok) {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  return (
    <article className="group rounded-lg border p-6 transition-shadow hover:shadow-md">
      {post.coverImage && (
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 700px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {post.author.username ? (
            <Link href={`/u/${post.author.username}`} className="hover:text-primary">
              {post.author.name || post.author.email}
            </Link>
          ) : (
            <span>{post.author.name || post.author.email}</span>
          )}
          <span>·</span>
          <time>{formatDate(post.createdAt)}</time>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-xl font-semibold group-hover:text-primary">{post.title}</h2>
        </Link>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground">{truncate(post.excerpt, 150)}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{post.viewCount} 阅读</span>
          {post._count && <span>{post._count.comments} 评论</span>}
          <button
            onClick={handleLike}
            disabled={!session?.user}
            className={`flex items-center gap-1 transition-colors ${
              liked ? "text-red-500" : "hover:text-red-400"
            }`}
            aria-label={liked ? "取消点赞" : "点赞"}
          >
            <svg className="h-4 w-4" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <span>{likeCount}</span>
          </button>
          {post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.slice(0, 3).map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="rounded-full bg-muted px-2 py-0.5 hover:bg-muted/80"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
