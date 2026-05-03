export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">关于</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          这是一个基于 Next.js 构建的现代博客平台。我们致力于为作者和读者提供
          流畅、优雅的阅读和写作体验。
        </p>
        <h2>功能特性</h2>
        <ul>
          <li>Markdown 文章编辑与预览</li>
          <li>分类标签系统</li>
          <li>嵌套评论与回复</li>
          <li>全文搜索</li>
          <li>响应式设计</li>
          <li>管理后台</li>
        </ul>
      </div>
    </div>
  );
}
