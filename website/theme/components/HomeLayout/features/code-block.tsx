import type { FC, ReactNode } from 'react';

export type CodeBlockProps = {
  children: ReactNode;
};

export const CodeBlock: FC<CodeBlockProps> = ({
  children,
}) => (
  <pre className="home-code"><code>{children}</code></pre>
);
