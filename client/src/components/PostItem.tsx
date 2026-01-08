import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@shared/schema";
import { motion } from "framer-motion";
import { useState } from "react";

interface PostItemProps {
  post: Post;
  index: number;
}

export function PostItem({ post, index }: PostItemProps) {
  const [imageError, setImageError] = useState(false);

  // Helper to try and fix common non-direct image links
  const getDirectImageUrl = (url: string) => {
    if (!url) return "";
    // postimg.cc simple transformation if possible
    if (url.includes("postimg.cc") && !url.includes("i.postimg.cc") && !url.endsWith(".png") && !url.endsWith(".jpg")) {
      // This is a guess but common for postimg page URLs
      // Usually it's better to just let it fail and hide it
    }
    return url;
  };

  const imageUrl = getDirectImageUrl(post.coverImageUrl || "");

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="mb-32 w-full max-w-2xl mx-auto px-6 md:px-0"
    >
      <div className="flex flex-col items-start gap-4">
        {/* Meta Data */}
        <time className="font-sans text-xs text-gray-400 uppercase tracking-widest">
          {post.createdAt ? format(new Date(post.createdAt), "d 'de' MMMM, yyyy", { locale: ptBR }) : ""}
        </time>

        {/* Optional Title */}
        {post.title && (
          <h2 className="text-3xl md:text-4xl font-serif font-medium leading-tight text-black mt-2 mb-4">
            {post.title}
          </h2>
        )}

        {/* Content - preserving whitespace/newlines */}
        <div className="font-serif text-lg md:text-xl leading-relaxed text-gray-900 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Optional Image */}
        {imageUrl && !imageError && (
          <div className="w-full mt-8 overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 ease-in-out">
            <img 
              src={imageUrl} 
              alt={post.title || "Imagem do post"} 
              className="w-full h-auto object-cover max-h-[600px]"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Separator for rhythm */}
        <div className="w-full flex justify-center mt-20">
          <span className="text-gray-200 text-xl">***</span>
        </div>
      </div>
    </motion.article>
  );
}
