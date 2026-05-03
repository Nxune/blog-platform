import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function listTags() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { name: "asc" },
  });
  return tags;
}

export async function getTagBySlug(slug: string) {
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  });
  return tag;
}

export async function createTag(name: string) {
  const slug = slugify(name);

  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) {
    throw new Error("标签已存在");
  }

  const tag = await prisma.tag.create({
    data: { name, slug },
  });

  return tag;
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
}
