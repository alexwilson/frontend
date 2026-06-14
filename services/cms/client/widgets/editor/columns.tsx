import React from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

import {
  SPLIT_NAMES,
  COLUMNS_DIRECTIVE,
  COLUMN_DIRECTIVE,
  type SplitName,
} from "@alexwilson/content";
import { Columns, Column } from "@alexwilson/ds-columns/src";

interface ColumnData {
  content: string;
  options?: { lang?: string };
}
interface ColumnsData {
  split: string;
  columns: ColumnData[];
}

const parseMarkdown = unified().use(remarkParse).use(remarkDirective);
const stringifyMarkdown = unified().use(remarkStringify).use(remarkDirective);

const renderHtml = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);
function renderColumn(content: string): string {
  return String(renderHtml.processSync(content || ""));
}

export function makeColumnsEditorComponent(locales: string[]) {
  return {
    id: COLUMNS_DIRECTIVE,
    label: "Columns",
    fields: [
      {
        name: "split",
        label: "Split",
        widget: "select",
        default: "two-equal",
        options: SPLIT_NAMES,
      },
      {
        name: "columns",
        label: "Columns",
        widget: "list",
        max: 3,
        collapsed: true,
        fields: [
          { name: "content", label: "Content", widget: "richtext" },
          {
            name: "options",
            label: "Options",
            widget: "object",
            collapsed: true,
            fields: [
              {
                name: "lang",
                label: "Language",
                widget: "select",
                options: locales,
                required: false,
              },
            ],
          },
        ],
      },
    ],

    // No `m` flag — Decap forbids it.
    pattern: /^(:{4,})columns\{[^}\n]*\}\n[\s\S]*?\n\1(?=\n|$)/,

    fromBlock(match: RegExpMatchArray): ColumnsData {
      const tree = parseMarkdown.parse(match[0]) as unknown as {
        children: Array<Record<string, unknown>>;
      };
      const block = tree.children.find(
        (n) => n.type === "containerDirective" && n.name === COLUMNS_DIRECTIVE,
      );
      const children = (block?.children as Array<Record<string, unknown>>) || [];
      const columns = children
        .filter((c) => c.type === "containerDirective" && c.name === COLUMN_DIRECTIVE)
        .map((column) => ({
          content: stringifyMarkdown
            .stringify({ type: "root", children: column.children } as never)
            .trimEnd(),
          options: { lang: ((column.attributes as Record<string, string>) || {}).lang || "" },
        }));
      const attributes = (block?.attributes as Record<string, string>) || {};
      return { split: attributes.split || "two-equal", columns };
    },

    toBlock(data: ColumnsData): string {
      const tree = {
        type: "root",
        children: [
          {
            type: "containerDirective",
            name: COLUMNS_DIRECTIVE,
            attributes: { split: data.split || "two-equal" },
            children: (data.columns || []).map((c) => ({
              type: "containerDirective",
              name: COLUMN_DIRECTIVE,
              attributes: c.options?.lang ? { lang: c.options.lang } : {},
              children: parseMarkdown.parse(c.content || "").children,
            })),
          },
        ],
      };
      return stringifyMarkdown.stringify(tree as never).trimEnd();
    },

    toPreview(data: ColumnsData) {
      const columns = data.columns || [];
      return (
        <Columns split={(data.split || "two-equal") as SplitName}>
          {columns.map((c, i) => (
            <Column key={i} lang={c.options?.lang || undefined}>
              <div dangerouslySetInnerHTML={{ __html: renderColumn(c.content) }} />
            </Column>
          ))}
        </Columns>
      );
    },
  };
}
