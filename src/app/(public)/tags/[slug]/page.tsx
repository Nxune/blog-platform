import { getTagBySlug } from "@/services/tag.service";
import { listPosts } from "@/services/post.service";
import { PostCard } from "@/components/blog/PostCard";
import { notFound } from "next/navigation";

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) notFound();

  const { posts } = await listPosts({ tag: slug, status: "PUBLISHED", pageSize: 50 });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">{tag.name}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {tag._count.posts} 篇文章
      </p>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">该标签下暂无文章</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
