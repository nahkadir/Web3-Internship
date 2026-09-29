import Post from "../models/Post.js";

export const createPost = async (authorId, { content, imageUrl }) => {
  const post = await Post.create({
    author: authorId,
    content,
    imageUrl: imageUrl || "",
  });

  // populate author so the response includes basic author info
  await post.populate("author", "name avatar");
  return post;
  // returns the populated post to the caller.
};

// Without populate(), the frontend would receive only the author's ID.
// If it needs to display the author's name and avatar beside the post,
// it would need to make another API request to fetch that information.
