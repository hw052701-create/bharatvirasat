// ── community.js — Community Module ─────────────────────────────────────────
const Community = {
  posts: [],
  page: 1,

  // ─── Render Community Page ────────────────────────────────────────────────
  render() {
    const user = Auth.currentUser;
    document.getElementById('app-content').innerHTML = `
      <div class="community-header">
        <div class="create-post-box" onclick="Community.openCreatePost()">
          <div class="create-post-avatar">${Auth.getInitials(user?.name)}</div>
          <span>Share your heritage story, photo or discovery...</span>
        </div>
      </div>
      <div class="posts-feed" id="posts-feed">
        ${Array(3).fill('<div class="skeleton skeleton-card"></div>').join('')}
      </div>
      <div id="load-more" style="padding:1rem;text-align:center"></div>`;

    Community.loadPosts();
  },

  // ─── Load Posts ───────────────────────────────────────────────────────────
  async loadPosts(append = false) {
    try {
      const res = await API.getPosts({ page: Community.page, limit: 10 });
      const feed = document.getElementById('posts-feed');
      if (!feed) return;

      if (!append) {
        Community.posts = res.data || [];
        feed.innerHTML = '';
      } else {
        Community.posts = [...Community.posts, ...(res.data || [])];
      }

      if (Community.posts.length === 0) {
        feed.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No stories yet</h3>
            <p>Be the first to share a heritage story!</p>
          </div>`;
        return;
      }

      if (!append) {
        feed.innerHTML = Community.posts.map(p => Community.renderPost(p)).join('');
      } else {
        feed.insertAdjacentHTML('beforeend', res.data.map(p => Community.renderPost(p)).join(''));
      }

      // Load more button
      const loadMoreEl = document.getElementById('load-more');
      if (loadMoreEl) {
        if (res.total > Community.posts.length) {
          loadMoreEl.innerHTML = `<button class="btn-secondary" onclick="Community.loadMore()">
            <i class="fas fa-chevron-down"></i> Load More
          </button>`;
        } else {
          loadMoreEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.8rem">You've seen all stories</p>`;
        }
      }
    } catch {
      const feed = document.getElementById('posts-feed');
      if (feed) feed.innerHTML = `<div class="empty-state">
        <i class="fas fa-wifi"></i><h3>Connection Error</h3><p>Please check your internet</p>
      </div>`;
    }
  },

  loadMore() {
    Community.page++;
    Community.loadPosts(true);
  },

  // ─── Render Post ──────────────────────────────────────────────────────────
  renderPost(post) {
    const typeColors = { story: '#D4AF37', photo: '#f093fb', discovery: '#43e97b', tip: '#4facfe' };
    const timeAgo = Community.timeAgo(post.createdAt);
    const authorName = post.author?.name || 'Explorer';
    const liked = false; // Would need user ID check

    return `
      <div class="post-card" id="post-${post._id}">
        <div class="post-header">
          <div class="post-avatar">${Auth.getInitials(authorName)}</div>
          <div class="post-meta">
            <div class="post-author">${authorName}</div>
            <div class="post-time">${timeAgo} • Level ${post.author?.level || 1}</div>
          </div>
          <div class="post-type-tag" style="color:${typeColors[post.type] || '#D4AF37'}">${post.type}</div>
        </div>

        ${post.images && post.images.length > 0
          ? `<img class="post-image" src="${post.images[0]}" alt="Post image" loading="lazy"
              onerror="this.remove()" />`
          : ''}

        <div class="post-content">
          ${post.content}
          ${post.heritage ? `
            <div class="post-heritage-link">
              <i class="fas fa-landmark"></i>
              <span onclick="Explorer.viewSite('${post.heritage._id || post.heritage}')" style="cursor:pointer">
                ${post.heritage.name || 'Heritage Site'}
              </span>
            </div>` : ''}
          ${post.tags && post.tags.length ? `
            <div style="margin-top:0.5rem">
              ${post.tags.map(t => `<span class="tag" style="margin-right:0.25rem">#${t}</span>`).join('')}
            </div>` : ''}
        </div>

        <div class="post-actions">
          <button class="post-action-btn" id="like-btn-${post._id}"
            onclick="Community.toggleLike('${post._id}')">
            <i class="fas fa-heart"></i>
            <span id="like-count-${post._id}">${post.likes?.length || 0}</span>
          </button>
          <button class="post-action-btn" onclick="Community.openComments('${post._id}')">
            <i class="fas fa-comment"></i>
            <span>${post.comments?.length || 0}</span>
          </button>
          <button class="post-action-btn" onclick="Community.sharePost('${post._id}')">
            <i class="fas fa-share-alt"></i>
            <span>Share</span>
          </button>
        </div>
      </div>`;
  },

  // ─── Toggle Like ──────────────────────────────────────────────────────────
  async toggleLike(postId) {
    try {
      const btn = document.getElementById(`like-btn-${postId}`);
      const countEl = document.getElementById(`like-count-${postId}`);
      const isLiked = btn.classList.contains('liked');

      btn.classList.toggle('liked');
      const currentCount = parseInt(countEl.textContent);
      countEl.textContent = isLiked ? currentCount - 1 : currentCount + 1;

      await API.likePost(postId);
    } catch {
      App.showToast('Failed to like', 'error');
    }
  },

  // ─── Open Comments ────────────────────────────────────────────────────────
  openComments(postId) {
    const post = Community.posts.find(p => p._id === postId);
    if (!post) return;

    App.showModal(`
      <h3 style="margin-bottom:1rem">💬 Comments</h3>
      <div style="max-height:300px;overflow-y:auto;margin-bottom:1rem">
        ${post.comments && post.comments.length > 0
          ? post.comments.map(c => `
            <div style="display:flex;gap:0.75rem;margin-bottom:0.875rem">
              <div class="create-post-avatar" style="width:32px;height:32px;font-size:0.75rem;flex-shrink:0">
                ${Auth.getInitials(c.author?.name || 'U')}
              </div>
              <div>
                <div style="font-size:0.85rem;font-weight:700">${c.author?.name || 'Explorer'}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.15rem">${c.text}</div>
              </div>
            </div>`).join('')
          : '<p style="color:var(--text-secondary);text-align:center;padding:1rem">No comments yet. Be first!</p>'
        }
      </div>
      <div class="input-group">
        <i class="fas fa-comment"></i>
        <input type="text" id="comment-input" placeholder="Write a comment..." />
      </div>
      <button class="btn-primary" style="margin-top:0.75rem" onclick="Community.submitComment('${postId}')">
        <i class="fas fa-paper-plane"></i><span>Post Comment</span>
      </button>`);
  },

  async submitComment(postId) {
    const text = document.getElementById('comment-input')?.value.trim();
    if (!text) return;

    try {
      await API.commentPost(postId, text);
      App.closeModal();
      App.showToast('Comment posted! 💬', 'success');

      // Update comment count
      const post = Community.posts.find(p => p._id === postId);
      if (post) post.comments = [...(post.comments || []), { text, author: Auth.currentUser }];
    } catch {
      App.showToast('Failed to post comment', 'error');
    }
  },

  // ─── Open Create Post ─────────────────────────────────────────────────────
  openCreatePost(heritageId = null, heritageName = null) {
    let selectedType = 'story';
    App.showModal(`
      <h3 style="margin-bottom:1rem">✍️ Share Your Story</h3>
      <div class="post-type-selector">
        ${['story', 'photo', 'discovery', 'tip'].map(t => `
          <div class="post-type-chip ${t === 'story' ? 'active' : ''}"
            onclick="document.querySelectorAll('.post-type-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active')"
            data-type="${t}">
            ${{ story: '📝', photo: '📸', discovery: '🔍', tip: '💡' }[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}
          </div>`).join('')}
      </div>
      ${heritageName ? `
        <div style="display:flex;align-items:center;gap:0.5rem;margin:0.75rem 0;padding:0.625rem;background:rgba(212,175,55,0.1);border-radius:var(--radius-md);border:1px solid var(--border)">
          <i class="fas fa-landmark" style="color:var(--gold)"></i>
          <span style="font-size:0.85rem;color:var(--gold)">📍 ${heritageName}</span>
        </div>` : ''}
      <textarea class="post-textarea" id="post-content-input"
        placeholder="Share your experience, discovery, or story about Indian heritage..."></textarea>
      <div class="input-group" style="margin-top:0.75rem">
        <i class="fas fa-hashtag" style="color:var(--gold)"></i>
        <input type="text" id="post-tags-input" placeholder="Tags: mughal, temple, art (comma separated)" />
      </div>
      <button class="btn-primary" style="margin-top:1rem"
        onclick="Community.submitPost('${heritageId || ''}')">
        <i class="fas fa-paper-plane"></i><span>Post Story</span>
      </button>`);

    setTimeout(() => document.getElementById('post-content-input')?.focus(), 300);
  },

  async submitPost(heritageId) {
    const content = document.getElementById('post-content-input')?.value.trim();
    if (!content) { App.showToast('Please write something!', 'error'); return; }

    const activeTypeChip = document.querySelector('.post-type-chip.active');
    const type = activeTypeChip?.dataset.type || 'story';
    const tagsInput = document.getElementById('post-tags-input')?.value;
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    try {
      const res = await API.createPost({ content, type, tags, heritage: heritageId || undefined });
      App.closeModal();
      App.showToast('Story posted! 🎉', 'success');
      Community.posts.unshift(res.data);
      Community.render();
    } catch (err) {
      App.showToast(err.message || 'Failed to post', 'error');
    }
  },

  // ─── Share Post ───────────────────────────────────────────────────────────
  sharePost(postId) {
    if (navigator.share) {
      navigator.share({ title: 'BharatVirasat', text: 'Check this out on BharatVirasat!', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      App.showToast('Link copied!', 'success');
    }
  },

  // ─── Time Ago ─────────────────────────────────────────────────────────────
  timeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
};
