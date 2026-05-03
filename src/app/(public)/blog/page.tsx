import { listPosts } from "@/services/post.service";
import { PostCard } from "@/components/blog/PostCard";

export const dynamic = "force-dynamic";

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const { posts, total, totalPages } = await listPosts({
    page,
    pageSize: 10,
    published: true,
    tag: params.tag,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">文章列表</h1>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">暂无文章</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/blog?page=${page - 1}`}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              上一页
            </a>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/blog?page=${page + 1}`}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
            >
              下一页
            </a>
          )}
        </div>
      )}
    </div>
  );
}
