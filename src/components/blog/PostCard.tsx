import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/types/post";
import { formatDate, truncate } from "@/lib/utils";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
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
          <span>{post.author.name || post.author.email}</span>
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
