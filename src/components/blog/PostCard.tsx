import Link from "next/link";
import Image from "next/image";

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: { name: string; slug: string };
  publishedAt: string;
  readTime: number;
  thumbnail?: string;
}

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostCard({ post, priority = false }: PostCardProps) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {post.thumbnail ? (
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-primary-200 to-primary-400 group-hover:scale-105 transition-transform duration-300" />
        )}
        {/* Category badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-primary-600 shadow-sm">
          {post.category.name}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readTime}분 읽기</span>
        </div>
      </div>
    </Link>
  );
}
