import { getPostBySlug } from "@/services/post.service";
import { formatDate } from "@/lib/utils";
import { CommentSection } from "@/components/comments/CommentSection";
import { notFound } from "next/navigation";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "文章未找到" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 space-y-4">
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="mb-6 w-full rounded-lg object-cover"
          />
        )}
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{post.author.name || post.author.email}</span>
          <span>·</span>
          <time>{formatDate(post.publishedAt ?? post.createdAt)}</time>
          <span>·</span>
          <span>{post.viewCount} 阅读</span>
        </div>
        {post.tags.length > 0 && (
          <div className="flex gap-2">
            {post.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full bg-muted px-3 py-1 text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose prose-lg max-w-none">
        {post.content.split("\n").map((line, i) => (
          <p key={i}>{line || " "}</p>
        ))}
      </div>

      <hr className="my-12" />

      <CommentSection postSlug={post.slug} />
    </article>
  );
}
