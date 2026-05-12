"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorEmail?: string;
  parentId?: string | null;
  replies?: CommentData[];
}

interface CommentsProps {
  postSlug: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: CommentData;
  onReply: (parentId: string, parentName: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className={`pl-4 border-l-2 border-[rgba(212,168,83,0.08)] ${comment.parentId ? "" : ""}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-[#d4a853]">
            {comment.authorName || comment.authorEmail?.split("@")[0] || "匿名"}
          </span>
          <span className="text-xs text-[#555]">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-[#ccc] leading-relaxed">{comment.content}</p>
        <button
          onClick={() => onReply(comment.id, comment.authorName || "")}
          className="text-xs text-[#555] hover:text-[#d4a853] mt-1 transition-colors"
        >
          回复
        </button>

        {/* 嵌套回复 */}
        {comment.replies && comment.replies.length > 0 && (
          <>
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-[#666] hover:text-[#d4a853] mt-1 ml-2 transition-colors"
            >
              {showReplies ? "收起回复" : `查看 ${comment.replies.length} 条回复`}
            </button>
            {showReplies && (
              <div className="mt-1">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} onReply={onReply} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Comments({ postSlug }: CommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);

  // 获取评论列表
  const fetchComments = async () => {
    const res = await fetch(`/api/comments?postSlug=${postSlug}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postSlug]);

  // 提交评论
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setSending(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        postSlug,
        parentId: replyTo?.id,
      }),
    });

    setSending(false);
    if (res.ok) {
      setContent("");
      setReplyTo(null);
      await fetchComments();
    }
  };

  return (
    <section id="comments" className="mt-10">
      <h3 className="font-[family-name:var(--font-ma-shan)] text-xl text-[#d4a853] mb-6">
        留言区 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      {!session ? (
        <div className="bg-[#12121a]/60 rounded-xl p-6 border border-[rgba(212,168,83,0.08)] text-center">
          <p className="text-sm text-[#9a9590]">
            请{" "}
            <span className="text-[#d4a853] cursor-pointer hover:underline" onClick={() => document.location.href="/login"}>
              登录
            </span>{" "}
            后发表留言
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-8">
          {/* 回复提示 */}
          {replyTo && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[rgba(212,168,83,0.08)] text-sm">
              <span className="text-[#9a9590]">正在回复：</span>
              <span className="text-[#d4a853] font-medium">{replyTo.name || "该用户"}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-[#555] hover:text-[#e8e6e3]"
              >
                ✕ 取消
              </button>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              replyTo
                ? `回复 ${replyTo.name || ""}...`
                : "写下你的想法..."
            }
            className="w-full min-h-[100px] px-4 py-3 rounded-xl bg-[#1a1a2e] border border-[rgba(212,168,83,0.12)] text-[#e8e6e3] placeholder-[#555] focus:outline-none focus:border-[#d4a853] transition-colors resize-y"
            required
          />

          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {sending ? "发送中..." : "发 布"}
            </button>
          </div>
        </form>
      )}

      {/* 评论列表 */}
      <div className="space-y-0">
        {comments.length === 0 && !loading ? (
          <p className="text-center text-[#444] py-8 text-sm">暂无留言，来说点什么吧</p>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} onReply={(id, name) => setReplyTo({ id, name })} />
          ))
        )}
      </div>
    </section>
  );
}
