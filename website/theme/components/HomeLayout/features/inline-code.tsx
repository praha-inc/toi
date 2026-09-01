import type { FC } from 'react';

export type InlineCodeProps = {
  text: string;
};

/**
 * i18n text is plain strings, not markdown — this turns `` `code` `` spans
 * inside it into real `<code>` elements so body copy can still reference
 * API names inline.
 */
export const InlineCode: FC<InlineCodeProps> = ({
  text,
}) => {
  const parts = text.split('`');

  return (
    <>
      {parts.map((part, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- parts are a stable split of static text, never reordered
        index % 2 === 1 ? <code key={index}>{part}</code> : <span key={index}>{part}</span>
      ))}
    </>
  );
};
