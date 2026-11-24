export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === 'blog.atschx.me' && url.pathname.startsWith('/cosmic-elements-exhibit')) {
      const target = new URL(request.url);
      target.hostname = 'atschx.github.io';
      return fetch(new Request(target.toString(), request));
    }
    return fetch(request);
  }
};
