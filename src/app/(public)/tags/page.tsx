import Link from "next/link";
import { listTags } from "@/services/tag.service";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listTags();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">标签</h1>

      {tags.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">暂无标签</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="rounded-full bg-muted px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary"
            >
              {tag.name}
              <span className="ml-1 text-xs text-muted-foreground">
                ({tag._count.posts})
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
