const json = (body, init = {}) => Response.json(body, {
  headers: {
    "Cache-Control": "no-store"
  },
  ...init
});

export class DownloadCounter {
  constructor(ctx) {
    this.ctx = ctx;
    this.count = 0;
    this.ready = this.ctx.blockConcurrencyWhile(async () => {
      this.count = (await this.ctx.storage.get("download_count")) ?? 0;
    });
  }

  async fetch(request) {
    await this.ready;

    if (request.method === "GET") {
      return json({ success: true, total_downloads: this.count });
    }

    if (request.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, {
        status: 405,
        headers: { Allow: "GET, POST" }
      });
    }

    this.count += 1;
    await this.ctx.storage.put("download_count", this.count);
    console.log(JSON.stringify({
      event: "mediafire_download_click",
      total_downloads: this.count
    }));

    return json({ success: true, total_downloads: this.count });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/track-download") {
      const id = env.DOWNLOAD_COUNTER.idFromName("global-download-counter");
      return env.DOWNLOAD_COUNTER.get(id).fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};
