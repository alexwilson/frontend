async function* webmentionIterator(token = "") {
  let page = 0;
  let hasMoreResults = true;

  while (hasMoreResults) {
    const response = await fetch(
      `https://webmention.io/api/mentions.jf2?token=${token}&page=${page}`,
    );
    const data = await response.json();

    if (data.children && data.children.length > 0) {
      yield data.children;
      page++;
    } else {
      hasMoreResults = false;
    }
  }
}

async function getAllWebmentions(token = "") {
  const allChildren = [];

  for await (const children of webmentionIterator(token)) {
    allChildren.push(...children);
  }

  return allChildren;
}

(async function main() {
  if (!process.env.WEBMENTION_IO_TOKEN) {
    throw new Error(
      "Need to set WEBMENTION_IO_TOKEN env variable with a valid webmention.io token",
    );
  }
  if (
    !process.env.WEBMENTION_WEBHOOK_TARGET ||
    !process.env.WEBMENTION_WEBHOOK_SECRET
  ) {
    throw new Error(
      "Need to set WEBMENTION_WEBHOOK_TARGET and WEBMENTION_WEBHOOK_SECRET with webhook information.",
    );
  }
  console.log("Fetching all mentions...");
  const mentions = await getAllWebmentions(process.env.WEBMENTION_IO_TOKEN);
  console.log(`Got ${mentions.length} mentions.`);

  console.log("Filtering for valid mentions");
  const contentRegex = /\/content\/(........-....-....-....-............)/;
  const validMentions = mentions.filter((item) =>
    contentRegex.test(item["wm-target"]),
  );
  console.log(`Now working with ${validMentions.length} mentions.`);

  for (const mention of validMentions) {
    const target = mention["wm-target"];
    const secret = process.env.WEBMENTION_WEBHOOK_SECRET;
    const body = {
      target,
      secret,
      post: mention,
    };
    console.log(`Sending webhook for ${target}`);
    const res = await fetch(process.env.WEBMENTION_WEBHOOK_TARGET, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`Failed sending webhook for ${target}`);
    }
  }
})();

// Usage example
