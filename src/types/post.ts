export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  featured: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  tags: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  _count?: {
    comments: number;
  };
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
